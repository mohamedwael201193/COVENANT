#!/usr/bin/env tsx
/** Judge audit: RPC, contracts, API, DB, MCP schema — real execution only */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { createPublicClient, http, parseAbiItem } from "viem";
import { loadChainConfig, abis } from "covenant-shared";
import { PrismaClient } from "@prisma/client";
import { toolDefinitions, dispatchTool } from "../packages/skill/src/tools/index.js";
import { createChainClients } from "../packages/skill/src/chain/clients.js";
import { loadConfig } from "../packages/skill/src/config.js";
import { GoPlusClient } from "../packages/skill/src/engine/riskRead.goplus.js";
import { LlmExplainer } from "../packages/skill/src/engine/explainer.llm.js";

loadEnv({ path: resolve(process.cwd(), ".env") });

const SKILL = process.env.SKILL_URL ?? "https://covenant-skill.onrender.com";
const chain = loadChainConfig();
const rpc = chain.rpcUrls.default.http[0]!;

async function section(title: string) {
  console.log(`\n${"=".repeat(60)}\n${title}\n${"=".repeat(60)}`);
}

async function main() {
  // PHASE 7 — RPC
  await section("PHASE 7 — RPC AUDIT");
  const client = createPublicClient({ transport: http(rpc) });
  const chainId = await client.getChainId();
  const block = await client.getBlockNumber();
  console.log("RPC URL:", rpc.replace(/\/[a-f0-9]{32}$/i, "/***"));
  console.log("chainId:", chainId, chainId === 688689 ? "PASS" : "FAIL");
  console.log("latest block:", block.toString());

  const attester = await client.readContract({
    address: chain.contracts.guardedExecutor,
    abi: abis.guardedExecutor,
    functionName: "attester",
  });
  console.log("eth_call attester:", attester);

  const gas = await client.estimateGas({
    to: chain.contracts.decisionLog,
    data: "0xb829df820000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
  });
  console.log("eth_estimateGas (decisions(0)):", gas.toString());

  const logs = await client.getLogs({
    address: chain.contracts.decisionLog,
    event: parseAbiItem("event DecisionLogged(uint256 indexed id, address indexed agent, bytes32 indexed intentHash, uint8 verdict, bytes32 reasonHash, bytes32 outcomeHash)"),
    fromBlock: block - 999n,
    toBlock: block,
  });
  console.log("eth_getLogs DecisionLogged (last 5000 blocks):", logs.length, "events");

  // PHASE 3 extended — ownership
  await section("PHASE 3 — CONTRACT OWNERSHIP & CONFIG");
  const contracts = [
    { name: "DecisionLog", addr: chain.contracts.decisionLog, abi: abis.decisionLog },
    { name: "GuardedExecutor", addr: chain.contracts.guardedExecutor, abi: abis.guardedExecutor },
    { name: "ReputationRegistry", addr: chain.contracts.reputationRegistry, abi: abis.reputationRegistry },
  ] as const;

  for (const c of contracts) {
    const owner = await client.readContract({
      address: c.addr,
      abi: c.abi,
      functionName: "owner",
    });
    console.log(`${c.name} owner:`, owner);
  }

  const repOracle = await client.readContract({
    address: chain.contracts.reputationRegistry,
    abi: abis.reputationRegistry,
    functionName: "oracle",
  });
  console.log("ReputationRegistry oracle:", repOracle);

  const nextId = await client.readContract({
    address: chain.contracts.decisionLog,
    abi: abis.decisionLog,
    functionName: "nextId",
  });
  console.log("DecisionLog nextId:", nextId.toString());

  // PHASE 8 — DB
  await section("PHASE 8 — INDEXER DATABASE");
  const prisma = new PrismaClient();
  const [agents, covenants, decisions, processed, state] = await Promise.all([
    prisma.agent.count(),
    prisma.covenant.count(),
    prisma.decision.count(),
    prisma.processedLog.count(),
    prisma.indexerState.findUnique({ where: { key: "last_processed_block" } }),
  ]);
  console.log("agents:", agents);
  console.log("covenants:", covenants);
  console.log("decisions:", decisions);
  console.log("processed_logs:", processed);
  console.log("last_processed_block:", state?.value ?? "NOT SET");
  await prisma.$disconnect();

  // PHASE 9 — API
  await section("PHASE 9 — API AUDIT");
  const endpoints: Array<{ method: string; path: string; body?: unknown }> = [
    { method: "GET", path: "/health" },
    { method: "GET", path: "/api/agents" },
    { method: "GET", path: "/api/covenants" },
    { method: "GET", path: "/api/decisions?limit=5" },
    { method: "GET", path: "/api/reputation" },
    { method: "GET", path: "/api/receipt/0" },
    {
      method: "POST",
      path: "/api/simulate",
      body: {
        intent: {
          agent: "0xfBb4A658f89736eD40CAAAD735bcedb3272C4600",
          target: "0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3",
          data: "0x",
          value: "0",
          nonce: "999999999",
        },
      },
    },
    {
      method: "POST",
      path: "/api/preflight",
      body: {
        agent: "0xfBb4A658f89736eD40CAAAD735bcedb3272C4600",
        target: "0x0000000000000000000000000000000000000001",
        data: "0x",
        value: "0",
        nonce: "888888888",
        covenantHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
      },
    },
  ];

  for (const ep of endpoints) {
    const res = await fetch(`${SKILL}${ep.path}`, {
      method: ep.method,
      headers: ep.body ? { "Content-Type": "application/json" } : undefined,
      body: ep.body ? JSON.stringify(ep.body) : undefined,
    });
    const text = await res.text();
    const preview = text.length > 200 ? `${text.slice(0, 200)}…` : text;
    console.log(`${ep.method} ${ep.path} → ${res.status}`);
    console.log("  ", preview.replace(/\n/g, " "));
  }

  const sse = await fetch(`${SKILL}/api/events/decisions`, {
    headers: { Accept: "text/event-stream" },
  });
  console.log(`GET /api/events/decisions → ${sse.status} content-type=${sse.headers.get("content-type")}`);
  await sse.body?.cancel();

  // PHASE 10 — MCP (local dispatch with real RPC)
  await section("PHASE 10 — MCP TOOL AUDIT (real RPC dispatch)");
  console.log("Tool count:", toolDefinitions.length);
  for (const t of toolDefinitions) {
    console.log(`  - ${t.name}: ${t.description.slice(0, 60)}…`);
  }

  const env = loadConfig();
  const clients = createChainClients(env);
  const services = { clients, env, goplus: new GoPlusClient(env), explainer: new LlmExplainer(env) };

  const repResult = await dispatchTool("reputation", {
    agent: "0xfBb4A658f89736eD40CAAAD735bcedb3272C4600",
  }, { clients, services });
  console.log("dispatch reputation:", JSON.stringify(repResult).slice(0, 150));

  const receiptResult = await dispatchTool("getReceipt", { decisionId: "0" }, { clients, services });
  console.log("dispatch getReceipt(0):", JSON.stringify(receiptResult).slice(0, 200));

  const simResult = await dispatchTool(
    "simulate",
    {
      intent: {
        agent: "0xfBb4A658f89736eD40CAAAD735bcedb3272C4600",
        target: "0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3",
        data: "0x",
        value: "0",
        nonce: "777777777",
      },
    },
    { clients, services },
  );
  console.log("dispatch simulate:", JSON.stringify(simResult).slice(0, 150));

  // PHASE 13 — reputation on-chain
  await section("PHASE 13 — REPUTATION ON-CHAIN");
  const demoAgent = "0xfBb4A658f89736eD40CAAAD735bcedb3272C4600" as const;
  const rep = await client.readContract({
    address: chain.contracts.reputationRegistry,
    abi: abis.reputationRegistry,
    functionName: "reputations",
    args: [demoAgent],
  });
  console.log("demo agent reputation:", { score: rep[0].toString(), tier: rep[1], updatedAt: rep[2].toString() });
}

main().catch((e) => {
  console.error("AUDIT FAILED:", e);
  process.exit(1);
});
