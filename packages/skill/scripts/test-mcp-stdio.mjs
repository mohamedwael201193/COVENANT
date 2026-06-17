#!/usr/bin/env node
/** MCP smoke test using official SDK client (Content-Length stdio). */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve } from "node:path";

const isPack = process.argv[2] === "pack";
const bin =
  process.env.MCP_BIN ??
  (isPack
    ? resolve(process.cwd(), "node_modules/covenant-mcp/dist/cli.js")
    : resolve(import.meta.dirname, "../../mcp/dist/cli.js"));

const env = {
  ...process.env,
  PHAROS_RPC_URL: process.env.BENCHMARK_RPC_URL ?? "https://atlantic.dplabs-internal.com",
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
    "covenant_connect_wallet",
    "covenant_create_session",
    "covenant_execute_authorized",
    "covenant_get_pending_approvals",
    "covenant_get_receipt",
    "covenant_health",
    "covenant_preflight",
    "covenant_register_identity",
    "covenant_reputation",
    "covenant_request_approval",
    "covenant_revoke_session",
    "covenant_rotate_key",
    "covenant_set_covenant",
    "covenant_sign_attestation",
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
