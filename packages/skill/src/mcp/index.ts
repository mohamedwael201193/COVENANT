import { runMcpStdio } from "./server.js";
export {
  createMcpServer,
  runMcpStdio,
  setMcpContext,
} from "./server.js";
export {
  toolDefinitions,
  toolAliases,
  resolveToolName,
  MCP_SERVER_INSTRUCTIONS,
  type ToolName,
} from "./definitions.js";
export { loadMcpConfig, loadMcpEnv, resolveOwnerPrivateKey, type McpEnv } from "./config.js";

/** CLI entry used by covenant-mcp bin */
export async function runMcpCli(): Promise<void> {
  const pino = (await import("pino")).default;
  const log = pino({ name: "covenant-mcp", level: process.env.LOG_LEVEL ?? "info" });
  await runMcpStdio(log);
}
