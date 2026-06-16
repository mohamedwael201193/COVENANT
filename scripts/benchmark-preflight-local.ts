#!/usr/bin/env tsx
/** Local preflight latency benchmark (no HTTP, PREFLIGHT_LLM_ENABLED=false). */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { loadConfig } from "../packages/skill/src/config.js";
import { createChainClients } from "../packages/skill/src/chain/clients.js";
import { GoPlusClient } from "../packages/skill/src/engine/riskRead.goplus.js";
import { LlmExplainer } from "../packages/skill/src/engine/explainer.llm.js";
import { runPreflight } from "../packages/skill/src/engine/preflight.js";

loadEnv({ path: resolve(process.cwd(), ".env") });
process.env.PREFLIGHT_LLM_ENABLED = "false";

const RUNS = 20;

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

async function main() {
  const env = loadConfig();
  const clients = createChainClients(env);
  const services = {
    clients,
    env,
    goplus: new GoPlusClient(env),
    explainer: new LlmExplainer(env),
  };

  const agents = await fetch(
    process.env.SKILL_URL ? `${process.env.SKILL_URL}/api/agents` : "http://localhost:8787/api/agents",
  ).then((r) => r.json()) as { agents: Array<{ agent: string; owner: string }> };
  const covenants = await fetch(
    process.env.SKILL_URL ? `${process.env.SKILL_URL}/api/covenants` : "http://localhost:8787/api/covenants",
  ).then((r) => r.json()) as { covenants: Array<{ agent: string; owner: string; covenantHash: string }> };

  const agent = agents.agents[0]!.agent;
  const cov = covenants.covenants[0]!;

  const request = {
    intent: {
      agent,
      target: cov.owner,
      data: "0x" as const,
      value: 0n,
      nonce: 1n,
    },
    covenantHash: cov.covenantHash as `0x${string}`,
    covenant: {
      version: "1" as const,
      agent,
      owner: cov.owner,
      allowlist: [cov.owner],
      denylist: [] as `0x${string}`[],
      baseMaxValueWei: "10000000000000000000",
      tierLimits: [],
      minCounterpartyTier: 0 as const,
      timeWindows: [],
      requiredChecks: ["simulation"] as ("simulation" | "goplus")[],
      createdAt: new Date().toISOString(),
    },
    deadlineSeconds: 3600,
  };

  const latencies: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    request.intent.nonce = BigInt(Date.now() + i);
    const start = performance.now();
    const result = await runPreflight(services, request);
    latencies.push(performance.now() - start);
    console.log(`Run ${i + 1}: ${latencies[i]!.toFixed(0)}ms verdict=${result.verdict}`);
  }

  latencies.sort((a, b) => a - b);
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  console.log("\navg_ms:", avg.toFixed(0));
  console.log("p95_ms:", percentile(latencies, 95).toFixed(0));
  console.log("p99_ms:", percentile(latencies, 99).toFixed(0));
}

main();
