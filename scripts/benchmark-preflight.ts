#!/usr/bin/env tsx
/**
 * Benchmark POST /api/preflight latency (avg, p95, p99).
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env") });

const SKILL_URL = process.env.SKILL_URL ?? "https://covenant-skill.onrender.com";
const RUNS = Number(process.env.PREFLIGHT_BENCH_RUNS ?? 20);

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

async function buildPayload() {
  const agents = await fetch(`${SKILL_URL}/api/agents`).then((r) => r.json()) as {
    agents: Array<{ agent: string; owner: string }>;
  };
  const covenants = await fetch(`${SKILL_URL}/api/covenants`).then((r) => r.json()) as {
    covenants: Array<{ agent: string; owner: string; covenantHash: string }>;
  };
  const agent = agents.agents[0]?.agent;
  const cov = covenants.covenants.find((c) => c.agent.toLowerCase() === agent?.toLowerCase());
  if (!agent || !cov) throw new Error("No agent/covenant on production API");

  return {
    intent: {
      agent,
      target: cov.owner,
      data: "0x",
      value: "0",
      nonce: String(Date.now() + Math.floor(Math.random() * 1_000_000)),
    },
    covenantHash: cov.covenantHash,
    covenant: {
      version: "1" as const,
      agent,
      owner: cov.owner,
      allowlist: [cov.owner],
      denylist: [] as string[],
      baseMaxValueWei: "10000000000000000000",
      tierLimits: [],
      minCounterpartyTier: 0,
      timeWindows: [],
      requiredChecks: ["simulation"] as ("simulation" | "goplus")[],
      createdAt: new Date().toISOString(),
    },
    deadlineSeconds: 3600,
  };
}

async function main() {
  const payload = await buildPayload();
  const latencies: number[] = [];
  let errors = 0;

  console.log(`\n=== PREFLIGHT BENCHMARK (${RUNS} runs) ===`);
  console.log("Target:", `${SKILL_URL}/api/preflight`);
  console.log("Agent:", payload.intent.agent);

  for (let i = 0; i < RUNS; i++) {
    payload.intent.nonce = String(Date.now() + i);
    const start = performance.now();
    const res = await fetch(`${SKILL_URL}/api/preflight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const ms = performance.now() - start;
    latencies.push(ms);
    if (!res.ok) {
      errors += 1;
      const body = await res.text();
      console.error(`Run ${i + 1}: HTTP ${res.status} ${body.slice(0, 120)}`);
    } else {
      const body = (await res.json()) as { verdict: string };
      console.log(`Run ${i + 1}: ${ms.toFixed(0)}ms verdict=${body.verdict}`);
    }
  }

  latencies.sort((a, b) => a - b);
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95 = percentile(latencies, 95);
  const p99 = percentile(latencies, 99);
  const max = latencies[latencies.length - 1]!;

  console.log("\n--- RESULTS ---");
  console.log("errors:", errors);
  console.log("avg_ms:", avg.toFixed(0));
  console.log("p95_ms:", p95.toFixed(0));
  console.log("p99_ms:", p99.toFixed(0));
  console.log("max_ms:", max.toFixed(0));

  if (errors > 0) process.exit(1);
  if (p99 > 5000) {
    console.error("\nFAIL: p99 exceeds 5000ms target");
    process.exit(1);
  }
  console.log("\n✓ Preflight latency within 5s target (p99)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
