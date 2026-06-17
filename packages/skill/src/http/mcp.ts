import type { Express, Request, Response } from "express";
import type { Logger } from "pino";
import type { PreflightServices } from "../engine/preflightEvaluate.js";
import type { ChainClients } from "../chain/clients.js";
import { dispatchTool } from "../tools/index.js";
import { MCP_SERVER_INSTRUCTIONS, resolveToolName, toolDefinitions } from "../mcp/definitions.js";

interface McpHttpContext {
  clients: ChainClients;
  services: PreflightServices;
  log: Logger;
}

interface JsonRpcRequest {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

function jsonRpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function jsonRpcError(id: JsonRpcRequest["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

async function handleJsonRpc(req: JsonRpcRequest, ctx: McpHttpContext) {
  switch (req.method) {
    case "initialize":
      return jsonRpcResult(req.id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "covenant", version: "0.2.4" },
        instructions: MCP_SERVER_INSTRUCTIONS,
      });

    case "notifications/initialized":
      return null;

    case "tools/list":
      return jsonRpcResult(req.id, {
        tools: toolDefinitions.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          ...("annotations" in tool ? { annotations: tool.annotations } : {}),
        })),
      });

    case "tools/call": {
      const params = req.params ?? {};
      const rawName = typeof params.name === "string" ? params.name : "";
      const name = resolveToolName(rawName);
      if (!name) return jsonRpcError(req.id, -32602, `Unknown tool: ${rawName}`);

      try {
        const result = await dispatchTool(name, params.arguments ?? {}, {
          clients: ctx.clients,
          services: ctx.services,
        });
        return jsonRpcResult(req.id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.log.error({ err: error, tool: name }, "HTTP MCP tool failed");
        return jsonRpcError(req.id, -32000, message);
      }
    }

    default:
      return jsonRpcError(req.id, -32601, `Method not found: ${req.method ?? "<missing>"}`);
  }
}

export function registerMcpHttpRoutes(app: Express, ctx: McpHttpContext): void {
  app.get("/mcp", (_req: Request, res: Response) => {
    res.json({
      name: "covenant",
      transport: "streamable-http-jsonrpc",
      endpoint: "/mcp",
      tools: toolDefinitions.length,
      instructions: MCP_SERVER_INSTRUCTIONS,
    });
  });

  app.post("/mcp", async (req: Request, res: Response) => {
    const body = req.body as JsonRpcRequest | JsonRpcRequest[];
    const requests = Array.isArray(body) ? body : [body];
    const replies = (await Promise.all(requests.map((r) => handleJsonRpc(r, ctx)))).filter(Boolean);
    if (Array.isArray(body)) {
      res.json(replies);
      return;
    }
    if (replies[0]) {
      res.json(replies[0]);
      return;
    }
    res.status(202).end();
  });
}
