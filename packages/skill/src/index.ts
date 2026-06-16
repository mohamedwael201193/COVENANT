#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Server as HttpServer } from "node:http";
import pino from "pino";
import { loadConfig, resolveSkillPort, shouldEnableMcpStdio } from "./config.js";
import { createChainClients } from "./chain/clients.js";
import { GoPlusClient } from "./engine/riskRead.goplus.js";
import { LlmExplainer } from "./engine/explainer.llm.js";
import { startDecisionWatcher } from "./chain/watchers.js";
import { createRestApp } from "./http/rest.js";
import { collectHealthState } from "./http/health.js";
import { probeRpcCapabilities } from "./engine/simulator.js";
import { dispatchTool, toolDefinitions } from "./tools/index.js";

const log = pino({ name: "covenant-skill", level: process.env.LOG_LEVEL ?? "info" });

async function main(): Promise<void> {
  const env = loadConfig();
  const port = resolveSkillPort(env);
  const clients = createChainClients(env);
  const goplus = new GoPlusClient(env);
  const explainer = new LlmExplainer(env);
  const services = { clients, env, goplus, explainer };

  const capabilities = await probeRpcCapabilities(clients.publicClient);
  log.info(
    {
      chainId: capabilities.chainId,
      blockNumber: capabilities.blockNumber.toString(),
      debugTraceCall: capabilities.debugTraceCall,
      ethCall: capabilities.ethCall,
      estimateGas: capabilities.estimateGas,
    },
    "RPC capability probe complete",
  );

  const health = await collectHealthState(clients);
  log.info(
    {
      attester: health.attesterAddress,
      onChainAttester: health.onChainAttester,
      attesterMatch: health.attesterMatch,
      balanceWei: health.attesterBalance.toString(),
    },
    "Attester health check",
  );

  if (!health.attesterMatch) {
    log.warn("Deployer key address does not match on-chain GuardedExecutor.attester");
  }

  const rest = createRestApp({ clients, services, log });
  const stopWatcher = startDecisionWatcher(clients, log);

  let httpServer: HttpServer | undefined;
  await new Promise<void>((resolve) => {
    httpServer = rest.listen(port, env.SKILL_SERVER_HOST, () => {
      log.info({ host: env.SKILL_SERVER_HOST, port }, "REST server listening");
      resolve();
    });
  });

  const shutdown = async (signal: string) => {
    log.info({ signal }, "shutting down skill server");
    stopWatcher?.();
    await new Promise<void>((resolve, reject) => {
      httpServer?.close((err) => (err ? reject(err) : resolve()));
    });
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  if (!shouldEnableMcpStdio(env)) {
    log.info("MCP stdio disabled (set MCP_STDIO_ENABLED=true for local Cursor use)");
    return;
  }

  const server = new Server(
    { name: "covenant-skill", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolDefinitions.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name as (typeof toolDefinitions)[number]["name"];
    try {
      const result = await dispatchTool(name, request.params.arguments ?? {}, {
        clients,
        services,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error({ err: error, tool: name }, "tool call failed");
      return {
        content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("MCP stdio transport connected");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
