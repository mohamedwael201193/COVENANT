import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Logger } from "pino";
import { createChainClients } from "../chain/clients.js";
import { GoPlusClient } from "../engine/riskRead.goplus.js";
import { LlmExplainer } from "../engine/explainer.llm.js";
import type { EnvConfig } from "../config.js";
import { dispatchTool } from "../tools/index.js";
import {
  MCP_SERVER_INSTRUCTIONS,
  resolveToolName,
  toolDefinitions,
} from "./definitions.js";
import { loadMcpConfig, resolveOwnerPrivateKey, type McpEnv } from "./config.js";

function mcpEnvToSkillEnv(mcp: McpEnv): EnvConfig {
  const pk = resolveOwnerPrivateKey(mcp);
  if (!pk) {
    throw new Error(
      "DEPLOYER_PRIVATE_KEY or COVENANT_OWNER_PRIVATE_KEY required for this tool. Read-only tools need PHAROS_RPC_URL only if using REST proxy.",
    );
  }
  if (!mcp.GOPLUS_APP_KEY || !mcp.GOPLUS_APP_SECRET) {
    throw new Error("GOPLUS_APP_KEY and GOPLUS_APP_SECRET required for COVENANT MCP");
  }
  return {
    PHAROS_CHAIN_ID: mcp.PHAROS_CHAIN_ID,
    PHAROS_RPC_URL: mcp.PHAROS_RPC_URL,
    PHAROS_RPC_URL_FALLBACK: mcp.PHAROS_RPC_URL_FALLBACK,
    DEPLOYER_PRIVATE_KEY: pk,
    GOPLUS_APP_KEY: mcp.GOPLUS_APP_KEY,
    GOPLUS_APP_SECRET: mcp.GOPLUS_APP_SECRET,
    GOPLUS_API_BASE: mcp.GOPLUS_API_BASE,
    PREFLIGHT_LLM_ENABLED: mcp.PREFLIGHT_LLM_ENABLED,
    PREFLIGHT_LLM_TIMEOUT_MS: mcp.PREFLIGHT_LLM_TIMEOUT_MS,
    SKILL_SERVER_HOST: "0.0.0.0",
    MCP_STDIO_ENABLED: true,
    SKILL_DECISION_WATCHER_ENABLED: false,
  } as EnvConfig;
}

let cachedCtx: ReturnType<typeof buildContext> | null = null;

/** Reuse REST server chain clients when skill index enables MCP stdio */
export function setMcpContext(ctx: ReturnType<typeof buildContext>): void {
  cachedCtx = ctx;
}

function buildContext(mcp: McpEnv) {
  const env = mcpEnvToSkillEnv(mcp);
  const clients = createChainClients(env);
  const services = {
    clients,
    env,
    goplus: new GoPlusClient(env),
    explainer: new LlmExplainer(env),
  };
  return { clients, services };
}

function getContext(): ReturnType<typeof buildContext> {
  if (!cachedCtx) {
    cachedCtx = buildContext(loadMcpConfig());
  }
  return cachedCtx;
}

export function createMcpServer(log: Logger): Server {
  const server = new Server(
    { name: "covenant", version: "0.1.0" },
    {
      capabilities: { tools: {} },
      instructions: MCP_SERVER_INSTRUCTIONS,
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolDefinitions.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      ...( "annotations" in t ? { annotations: t.annotations } : {}),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const rawName = request.params.name;
    const name = resolveToolName(rawName);
    if (!name) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: `Unknown tool: ${rawName}` }) }],
        isError: true,
      };
    }

    try {
      const result = await dispatchTool(name, request.params.arguments ?? {}, getContext());
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error({ err: error, tool: name }, "MCP tool failed");
      return {
        content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  });

  return server;
}

export async function runMcpStdio(log: Logger): Promise<void> {
  const server = createMcpServer(log);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("COVENANT MCP stdio connected");
}
