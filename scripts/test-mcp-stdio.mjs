#!/usr/bin/env node
/** MCP smoke test using official SDK client (Content-Length stdio). */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const isPack = process.argv[2] === "pack";
const bin =
  process.env.MCP_BIN ??
  (isPack
    ? resolve(process.cwd(), "node_modules/covenant-mcp/dist/cli.js")
    : resolve(root, "packages/mcp/dist/cli.js"));

const env = {
  ...process.env,
  PHAROS_RPC_URL: process.env.PHAROS_RPC_URL ?? "https://atlantic-rpc.pharosnetwork.xyz",
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
  const names = tools.map((t) => t.name).sort();
  const expected = [
    "covenant_attest_outcome",
    "covenant_get_receipt",
    "covenant_health",
    "covenant_preflight",
    "covenant_register_identity",
    "covenant_reputation",
    "covenant_rotate_key",
    "covenant_set_covenant",
    "covenant_simulate",
    "covenant_verify_counterparty",
  ];
  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    console.error("FAIL: tool mismatch", names);
    process.exit(1);
  }
  console.log("PASS: tools/list", names.length, "tools");
  for (const t of tools) {
    if (!t.description || !t.inputSchema) {
      console.error("FAIL: missing schema/description", t.name);
      process.exit(1);
    }
  }
  console.log("PASS: all tools have description + inputSchema");

  const health = await client.callTool({ name: "covenant_health", arguments: {} });
  console.log("PASS: covenant_health", JSON.stringify(health.content?.[0]?.text ?? health).slice(0, 120));
} finally {
  await transport.close();
}
