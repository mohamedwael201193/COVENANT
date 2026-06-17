#!/usr/bin/env node
/** Benchmark MCP tool latency — run from packages/skill (MCP SDK dep). */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve } from "node:path";
import { writeFileSync } from "node:fs";

const bin = process.env.MCP_BIN ?? resolve(import.meta.dirname, "../../mcp/dist/cli.js");
// Public contract probe — not a personal wallet (override via COVENANT_PROBE_AGENT)
const agent =
  process.env.COVENANT_PROBE_AGENT ?? "0x05545F026b75f03aE9Cf1eA8a8373473c94ed323";
const root = resolve(import.meta.dirname, "../../..");

const env = {
  ...process.env,
  PHAROS_RPC_URL: process.env.BENCHMARK_RPC_URL ?? "https://atlantic.dplabs-internal.com",
  PREFLIGHT_LLM_ENABLED: "false",
  LOG_LEVEL: "error",
};

const TARGETS = {
  startup: 500,
  covenant_health: 1000,
  covenant_reputation: 500,
  covenant_simulate: 1500,
  covenant_preflight: 2000,
};

async function timed(label, fn) {
  const t0 = performance.now();
  const result = await fn();
  const ms = Math.round(performance.now() - t0);
  const target = TARGETS[label];
  const ok = target ? ms <= target : true;
  console.log(`${label}: ${ms}ms${target ? (ok ? " ✓" : ` ✗ (target ${target}ms)`) : ""}`);
  return { ms, ok, result };
}

const transport = new StdioClientTransport({ command: process.execPath, args: [bin], env });
const client = new Client({ name: "bench", version: "1.0.0" });

const results = {};

const startup0 = performance.now();
await client.connect(transport);
results.startup = Math.round(performance.now() - startup0);
console.log(
  `startup: ${results.startup}ms${results.startup <= TARGETS.startup ? " ✓" : ` ✗ (target ${TARGETS.startup}ms)`}`,
);

results.covenant_health = (await timed("covenant_health", () =>
  client.callTool({ name: "covenant_health", arguments: {} }),
)).ms;

results.covenant_reputation = (
  await timed("covenant_reputation", () =>
    client.callTool({ name: "covenant_reputation", arguments: { agent } }),
  )
).ms;

const simulateIntent = {
  agent,
  target: "0x05545F026b75f03aE9Cf1eA8a8373473c94ed323",
  data: "0x",
  value: "0",
  nonce: String(Date.now()),
};

results.covenant_simulate = (
  await timed("covenant_simulate", () =>
    client.callTool({ name: "covenant_simulate", arguments: { intent: simulateIntent } }),
  )
).ms;

const preflightPayload = {
  intent: { ...simulateIntent, value: "1", nonce: "1" },
  covenantHash: "0x" + "aa".repeat(32),
  covenant: {
    version: "1",
    agent,
    owner: agent,
    allowlist: ["0x05545F026b75f03aE9Cf1eA8a8373473c94ed323"],
    denylist: [],
    baseMaxValueWei: "1000000000000000000",
    tierLimits: [{ tier: 1, maxValueWei: "1000000000000000000" }],
    minCounterpartyTier: 0,
    timeWindows: [],
    requiredChecks: ["simulation"],
    createdAt: new Date().toISOString(),
  },
};

results.covenant_preflight = (
  await timed("covenant_preflight", () =>
    client.callTool({ name: "covenant_preflight", arguments: preflightPayload }),
  )
).ms;

await transport.close();

const report = {
  timestamp: new Date().toISOString(),
  bin,
  rpc: env.PHAROS_RPC_URL,
  results,
  targets: TARGETS,
  pass: Object.entries(TARGETS).every(([k, t]) => (results[k] ?? 0) <= t),
};

const reportPath = resolve(root, "docs/skill/BENCHMARK_REPORT.json");
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\nReport: ${reportPath}`);
console.log(report.pass ? "ALL TARGETS MET" : "SOME TARGETS MISSED — see report");
