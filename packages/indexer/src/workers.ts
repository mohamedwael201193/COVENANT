import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Job } from "bullmq";
import type { Logger } from "pino";
import { abis } from "@covenant/shared";
import type { EnvConfig } from "./config.js";
import { getChainConfig } from "./config.js";
import { prisma } from "./db/client.js";
import {
  enqueueCacheWarm,
  reputationCacheKey,
  type CacheWarmJobData,
  type IngestJobData,
  type QueueBundle,
  type ScoreJobData,
} from "./queue.js";
import { fromStoredPayload, type RawLogPayload } from "./types.js";
import { isLogProcessed, projectLog } from "./projectors/index.js";
import {
  proposeScoreAfterBreach,
  proposeScoreAfterDecision,
} from "./scoring/oracle.js";

export interface WorkerContext {
  env: EnvConfig;
  queues: QueueBundle;
  log: Logger;
}

async function writeOnChainScore(
  ctx: WorkerContext,
  agent: Address,
  score: bigint,
  tier: number,
  decisionIds: bigint[],
): Promise<Hex | null> {
  if (!ctx.env.INDEXER_ORACLE_ENABLED || !ctx.env.DEPLOYER_PRIVATE_KEY) {
    ctx.log.debug("oracle write skipped (disabled or no key)");
    return null;
  }

  const chain = getChainConfig();
  const account = privateKeyToAccount(ctx.env.DEPLOYER_PRIVATE_KEY);
  const publicClient = createPublicClient({
    chain: {
      id: chain.chainId,
      name: chain.name,
      nativeCurrency: chain.nativeCurrency,
      rpcUrls: chain.rpcUrls,
    },
    transport: http(chain.rpcUrls.default.http[0]),
  });
  const walletClient = createWalletClient({
    account,
    chain: {
      id: chain.chainId,
      name: chain.name,
      nativeCurrency: chain.nativeCurrency,
      rpcUrls: chain.rpcUrls,
    },
    transport: http(chain.rpcUrls.default.http[0]),
  });

  const hash = await walletClient.writeContract({
    address: chain.contracts.reputationRegistry,
    abi: abis.reputationRegistry,
    functionName: "updateScore",
    args: [agent, score, tier, decisionIds],
    chain: {
      id: chain.chainId,
      name: chain.name,
      nativeCurrency: chain.nativeCurrency,
      rpcUrls: chain.rpcUrls,
    },
    account,
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

function agentFromEvent(payload: RawLogPayload): string | undefined {
  if ("agent" in payload.event) return payload.event.agent;
  return undefined;
}

export function createIngestHandler(ctx: WorkerContext) {
  return async (job: Job<IngestJobData>): Promise<void> => {
    const payload = fromStoredPayload(job.data.payload);
    if (await isLogProcessed(payload.txHash, payload.logIndex)) {
      ctx.log.debug({ jobId: job.id }, "log already processed");
      return;
    }
    await projectLog(payload);
    const agent = agentFromEvent(payload);
    if (agent) await enqueueCacheWarm(ctx.queues, agent);
    ctx.log.info({ jobId: job.id, kind: payload.event.kind }, "projected log");
  };
}

async function readOnChainScore(agent: Address): Promise<bigint> {
  const chain = getChainConfig();
  const client = createPublicClient({
    transport: http(chain.rpcUrls.default.http[0]!),
  });
  const result = (await client.readContract({
    address: chain.contracts.reputationRegistry,
    abi: abis.reputationRegistry,
    functionName: "reputations",
    args: [agent],
  })) as readonly [bigint, number, bigint];
  return result[0];
}

export function createScoreHandler(ctx: WorkerContext) {
  return async (job: Job<ScoreJobData>): Promise<void> => {
    const { agent, decisionId, verdict, breachIntentHash } = job.data;
    const agentLower = agent.toLowerCase();

    const existing = await prisma.reputation.findUnique({ where: { agent: agentLower } });
    let currentScore = existing?.score ?? 0n;
    try {
      const onChainScore = await readOnChainScore(agentLower as Address);
      if (onChainScore > currentScore) {
        currentScore = onChainScore;
      }
    } catch {
      // keep DB score
    }

    let proposal;
    if (decisionId !== undefined && verdict !== undefined) {
      proposal = proposeScoreAfterDecision(agentLower, decisionId, verdict, currentScore);
      const baseline = proposeScoreAfterDecision(agentLower, decisionId, verdict, 0n);
      if (currentScore >= baseline.score) {
        ctx.log.info({ jobId: job.id, agent: agentLower, score: currentScore.toString() }, "score already reflects decision");
        return;
      }
    } else if (breachIntentHash) {
      const related = await prisma.decision.findMany({
        where: { agent: agentLower, intentHash: breachIntentHash.toLowerCase() },
        select: { id: true },
      });
      proposal = proposeScoreAfterBreach(
        agentLower,
        related.map((d) => d.id),
        currentScore,
      );
    }

    if (!proposal) {
      ctx.log.warn({ jobId: job.id }, "no score proposal");
      return;
    }

    await prisma.agent.upsert({
      where: { address: agentLower },
      create: {
        address: agentLower,
        owner: agentLower,
        metadataUri: "",
        registeredAt: new Date(),
        lastActive: new Date(),
      },
      update: { lastActive: new Date() },
    });

    await prisma.reputation.upsert({
      where: { agent: agentLower },
      create: {
        agent: agentLower,
        score: proposal.score,
        tier: proposal.tier,
        updatedAt: new Date(),
      },
      update: {
        score: proposal.score,
        tier: proposal.tier,
        updatedAt: new Date(),
      },
    });

    for (const id of proposal.decisionIds) {
      await prisma.reputationSource.upsert({
        where: {
          repWriteId_decisionId: {
            repWriteId: `${job.data.txHash.toLowerCase()}:score`,
            decisionId: id.toString(),
          },
        },
        create: {
          repWriteId: `${job.data.txHash.toLowerCase()}:score`,
          decisionId: id.toString(),
          agent: agentLower,
        },
        update: {},
      });
    }

    try {
      await writeOnChainScore(
        ctx,
        agentLower as Address,
        proposal.score,
        proposal.tier,
        proposal.decisionIds,
      );
    } catch (err) {
      ctx.log.error({ err, agent: agentLower }, "on-chain score write failed");
    }

    await enqueueCacheWarm(ctx.queues, agentLower);
    ctx.log.info({ jobId: job.id, agent: agentLower, score: proposal.score.toString() }, "scored agent");
  };
}

export function createCacheWarmHandler(ctx: WorkerContext) {
  return async (job: Job<CacheWarmJobData>): Promise<void> => {
    const agent = job.data.agent.toLowerCase();
    const rep = await prisma.reputation.findUnique({ where: { agent } });
    const payload = rep
      ? JSON.stringify({ agent, score: rep.score.toString(), tier: rep.tier, updatedAt: rep.updatedAt.toISOString() })
      : JSON.stringify({ agent, score: "0", tier: 0, updatedAt: null });

    await ctx.queues.redis.set(reputationCacheKey(agent), payload, "EX", 300);
  };
}
