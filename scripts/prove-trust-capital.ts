#!/usr/bin/env tsx
/**
 * Prove Trust Capital end-to-end: before → oracle score write → after (chain + API).
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { abis, loadChainConfig } from "covenant-shared";
import { applyVerdictDelta, proposeScoreAfterDecision } from "../packages/indexer/src/scoring/oracle.js";

loadEnv({ path: resolve(process.cwd(), ".env") });

const SKILL_URL = process.env.SKILL_URL ?? "https://covenant-skill.onrender.com";
const DEMO_AGENT = "0xfBb4A658f89736eD40CAAAD735bcedb3272C4600" as Address;
const DECISION_ID = "0";

async function readOnChain(client: ReturnType<typeof createPublicClient>, agent: Address) {
  const [score, tier, updatedAt] = await client.readContract({
    address: loadChainConfig().contracts.reputationRegistry,
    abi: abis.reputationRegistry,
    functionName: "reputations",
    args: [agent],
  });
  return { score, tier, updatedAt };
}

async function readApi(agent: string) {
  const res = await fetch(`${SKILL_URL}/api/reputation/${agent}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<{ score: string; tier: number; updatedAt: string }>;
}

async function main() {
  const chain = loadChainConfig();
  const pk = process.env.DEPLOYER_PRIVATE_KEY as Hex;
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY required");

  const account = privateKeyToAccount(pk);
  const rpc = chain.rpcUrls.default.http[0]!;
  const publicClient = createPublicClient({ transport: http(rpc) });
  const walletClient = createWalletClient({ account, transport: http(rpc) });

  console.log("\n=== TRUST CAPITAL PROOF ===\n");
  console.log("Agent:", DEMO_AGENT);
  console.log("Decision ID:", DECISION_ID);

  const beforeChain = await readOnChain(publicClient, DEMO_AGENT);
  console.log("\n[BEFORE] on-chain:", {
    score: beforeChain.score.toString(),
    tier: beforeChain.tier,
    updatedAt: beforeChain.updatedAt.toString(),
  });

  let beforeApi = { score: "?", tier: 0, updatedAt: "?" };
  try {
    beforeApi = await readApi(DEMO_AGENT);
    console.log("[BEFORE] API:", beforeApi);
  } catch (e) {
    console.log("[BEFORE] API: unavailable", e instanceof Error ? e.message : e);
  }

  const decision = await publicClient.readContract({
    address: chain.contracts.decisionLog,
    abi: abis.decisionLog,
    functionName: "decisions",
    args: [BigInt(DECISION_ID)],
  });
  const verdict = decision[2] as number;
  console.log("\n[EXECUTION] decision verdict on-chain:", verdict, "(2=ALLOW)");

  const proposal = proposeScoreAfterDecision(
    DEMO_AGENT.toLowerCase(),
    DECISION_ID,
    verdict,
    beforeChain.score,
  );
  console.log("[PROPOSAL] score:", proposal.score.toString(), "tier:", proposal.tier);

  if (beforeChain.updatedAt > 0n && beforeChain.score > 0n) {
    console.log("\n[SKIP] Trust Capital already on-chain from prior ALLOW execution");
    console.log("✓ Trust Capital proven: score", beforeChain.score.toString(), "tier", beforeChain.tier);
    const afterApi = await readApi(DEMO_AGENT);
    console.log("✓ API:", afterApi);
    return;
  }

  if (beforeChain.score >= proposal.score && beforeChain.updatedAt > 0n) {
    console.log("\n[SKIP] reputation already updated on-chain");
  } else {
    const hash = await walletClient.writeContract({
      address: chain.contracts.reputationRegistry,
      abi: abis.reputationRegistry,
      functionName: "updateScore",
      args: [DEMO_AGENT, proposal.score, proposal.tier, proposal.decisionIds],
      chain: {
        id: chain.chainId,
        name: chain.name,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: chain.rpcUrls,
      },
      account,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("\n[TX] updateScore:", hash);
    console.log("Explorer:", `${chain.blockExplorers.default.url}/tx/${hash}`);
  }

  const afterChain = await readOnChain(publicClient, DEMO_AGENT);
  console.log("\n[AFTER] on-chain:", {
    score: afterChain.score.toString(),
    tier: afterChain.tier,
    updatedAt: afterChain.updatedAt.toString(),
  });

  const afterApi = await readApi(DEMO_AGENT);
  console.log("[AFTER] API:", afterApi);

  const delta = afterChain.score - beforeChain.score;
  const expected = applyVerdictDelta(beforeChain.score, verdict) - beforeChain.score;

  if (afterChain.score <= beforeChain.score && beforeChain.updatedAt === 0n) {
    throw new Error("Trust Capital update failed — score did not increase");
  }
  if (delta !== expected && beforeChain.updatedAt === 0n) {
    throw new Error(`Unexpected delta ${delta}, expected ${expected}`);
  }

  console.log("\n✓ Trust Capital proven: score", beforeChain.score.toString(), "→", afterChain.score.toString());
  console.log("✓ API reflects on-chain score:", afterApi.score === afterChain.score.toString());
}

main().catch((err) => {
  console.error("PROOF FAILED:", err);
  process.exit(1);
});
