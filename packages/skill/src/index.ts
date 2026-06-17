#!/usr/bin/env node
import type { Server as HttpServer } from "node:http";
import pino from "pino";
import { loadConfig, resolveSkillPort, shouldEnableMcpStdio, shouldEnableDecisionWatcher } from "./config.js";
import { createChainClients } from "./chain/clients.js";
import { GoPlusClient } from "./engine/riskRead.goplus.js";
import { LlmExplainer } from "./engine/explainer.llm.js";
import { startDecisionWatcher } from "./chain/watchers.js";
import { createRestApp } from "./http/rest.js";
import { collectHealthState } from "./http/health.js";
import { probeRpcCapabilities } from "./engine/simulator.js";
import { runMcpStdio, setMcpContext } from "./mcp/server.js";

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
  const stopWatcher = shouldEnableDecisionWatcher(env)
    ? startDecisionWatcher(clients, log)
    : () => {
        log.info("DecisionLog watcher disabled (indexer handles chain events)");
      };

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

  setMcpContext({ clients, services });
  await runMcpStdio(log);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
