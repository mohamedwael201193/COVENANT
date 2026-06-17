import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Logger } from "pino";
import { createChainClients, createPublicChainClients } from "../chain/clients.js";
import { GoPlusClient } from "../engine/riskRead.goplus.js";
import { LlmExplainer } from "../engine/explainer.llm.js";
import type { EnvConfig } from "../config.js";
import { dispatchTool } from "../tools/index.js";
import {
  MCP_SERVER_INSTRUCTIONS,
  resolveToolName,
  toolDefinitions,
  type ToolName,
} from "./definitions.js";
import { loadMcpConfig, resolveOwnerPrivateKey, type McpEnv } from "./config.js";
import type { PreflightServices } from "../engine/preflightEvaluate.js";
import { jsonSafeStringify } from "../util/json.js";

const PUBLIC_TOOLS = new Set<ToolName>([
  "covenant_health",
  "covenant_reputation",
  "covenant_get_receipt",
  "covenant_simulate",
  "covenant_preflight",
  "covenant_verify_counterparty",
  "covenant_sign_attestation",
  "covenant_connect_wallet",
  "covenant_create_session",
  "covenant_request_approval",
  "covenant_get_pending_approvals",
  "covenant_execute_authorized",
  "covenant_revoke_session",
]);

const PRIVILEGED_TOOLS = new Set<ToolName>([
  "covenant_attest_outcome",
  "covenant_register_identity",
  "covenant_set_covenant",
  "covenant_rotate_key",
]);

type McpContext = { clients: ReturnType<typeof createPublicChainClients> extends infer P ? P & { walletClient?: unknown; attesterAccount?: unknown } : never; services: PreflightServices };

let cachedPublicCtx: McpContext | null = null;
let cachedFullCtx: McpContext | null = null;

export function setMcpContext(ctx: McpContext): void {
  cachedFullCtx = ctx;
}

function buildPublicContext(mcp: McpEnv): McpContext {
  const partial = createPublicChainClients(mcp);
  const env = {
    PHAROS_CHAIN_ID: mcp.PHAROS_CHAIN_ID,
    PHAROS_RPC_URL: mcp.PHAROS_RPC_URL,
    PHAROS_RPC_URL_FALLBACK: mcp.PHAROS_RPC_URL_FALLBACK,
    GOPLUS_API_BASE: mcp.GOPLUS_API_BASE,
    PREFLIGHT_LLM_ENABLED: mcp.PREFLIGHT_LLM_ENABLED,
    PREFLIGHT_LLM_TIMEOUT_MS: mcp.PREFLIGHT_LLM_TIMEOUT_MS,
    COVENANT_API_URL: mcp.COVENANT_API_URL,
  } as EnvConfig;

  const goplus =
    mcp.GOPLUS_APP_KEY && mcp.GOPLUS_APP_SECRET
      ? new GoPlusClient({
          ...env,
          GOPLUS_APP_KEY: mcp.GOPLUS_APP_KEY,
          GOPLUS_APP_SECRET: mcp.GOPLUS_APP_SECRET,
        } as EnvConfig)
      : null;

  const stubAccount = { address: partial.contracts.attester };
  const clients = {
    ...partial,
    walletClient: null,
    attesterAccount: stubAccount,
  } as McpContext["clients"];

  return {
    clients,
    services: {
      clients: clients as PreflightServices["clients"],
      env,
      goplus,
      explainer: new LlmExplainer(env),
    },
  };
}

function buildPrivilegedContext(mcp: McpEnv): McpContext {
  const pk = resolveOwnerPrivateKey(mcp);
  if (!pk) {
    throw new Error(
      "Privileged tool requires DEPLOYER_PRIVATE_KEY or use COVENANT_API_URL=https://covenant-skill.onrender.com for hosted attestation.",
    );
  }
  const env = {
    PHAROS_CHAIN_ID: mcp.PHAROS_CHAIN_ID,
    PHAROS_RPC_URL: mcp.PHAROS_RPC_URL,
    PHAROS_RPC_URL_FALLBACK: mcp.PHAROS_RPC_URL_FALLBACK,
    DEPLOYER_PRIVATE_KEY: pk,
    GOPLUS_APP_KEY: mcp.GOPLUS_APP_KEY ?? "",
    GOPLUS_APP_SECRET: mcp.GOPLUS_APP_SECRET ?? "",
    GOPLUS_API_BASE: mcp.GOPLUS_API_BASE,
    PREFLIGHT_LLM_ENABLED: mcp.PREFLIGHT_LLM_ENABLED,
    PREFLIGHT_LLM_TIMEOUT_MS: mcp.PREFLIGHT_LLM_TIMEOUT_MS,
  } as EnvConfig;
  const clients = createChainClients(env);
  return {
    clients,
    services: {
      clients,
      env,
      goplus: mcp.GOPLUS_APP_KEY ? new GoPlusClient(env) : null,
      explainer: new LlmExplainer(env),
    },
  };
}

function getContextForTool(name: ToolName): McpContext {
  if (cachedFullCtx && PRIVILEGED_TOOLS.has(name)) {
    return cachedFullCtx;
  }
  if (PUBLIC_TOOLS.has(name)) {
    if (!cachedPublicCtx) {
      cachedPublicCtx = buildPublicContext(loadMcpConfig());
    }
    return cachedPublicCtx;
  }
  if (!cachedFullCtx) {
    cachedFullCtx = buildPrivilegedContext(loadMcpConfig());
  }
  return cachedFullCtx;
}

export function createMcpServer(log: Logger): Server {
  const server = new Server(
    { name: "covenant", version: "0.2.7" },
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
      ...("annotations" in t ? { annotations: t.annotations } : {}),
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
      const result = await dispatchTool(
        name,
        request.params.arguments ?? {},
        getContextForTool(name) as { clients: import("../chain/clients.js").ChainClients; services: PreflightServices },
      );
      return {
        content: [{ type: "text", text: jsonSafeStringify(result, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error({ err: error, tool: name }, "MCP tool failed");
      return {
        content: [{ type: "text", text: jsonSafeStringify({ error: message }) }],
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
  log.info("COVENANT MCP stdio connected (v0.2 — secret-free preflight)");
}
