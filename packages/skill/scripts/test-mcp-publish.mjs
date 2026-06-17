#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve } from "node:path";

const bin =
  process.env.MCP_BIN ?? resolve(import.meta.dirname, "../../mcp/dist/cli.js");

const env = {
  ...process.env,
  PHAROS_RPC_URL: process.env.PHAROS_RPC_URL ?? "https://atlantic.dplabs-internal.com",
  PREFLIGHT_LLM_ENABLED: "false",
  LOG_LEVEL: "error",
};

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [bin],
  env,
});

const client = new Client({ name: "covenant-test", version: "1.0.0" });

try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  console.log("PASS: tools/list", tools.length, "tools");
  const health = await client.callTool({ name: "covenant_health", arguments: {} });
  console.log("PASS: covenant_health");
  console.log(JSON.stringify(health, null, 2).slice(0, 400));
} finally {
  await transport.close();
}
