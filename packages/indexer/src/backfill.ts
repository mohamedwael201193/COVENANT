import type { Logger } from "pino";
import { prisma } from "./db/client.js";
import { enqueueScore, type QueueBundle } from "./queue.js";

/** Re-enqueue score jobs for decisions that never received a reputation write. */
export async function backfillMissingReputationScores(
  queues: QueueBundle,
  log: Logger,
): Promise<number> {
  const decisions = await prisma.decision.findMany({
    select: { id: true, agent: true, verdict: true, txHash: true, logIndex: true },
  });

  let enqueued = 0;
  for (const decision of decisions) {
    const cited = await prisma.reputationSource.findFirst({
      where: { decisionId: decision.id },
    });
    if (cited) continue;

    await enqueueScore(queues, {
      agent: decision.agent,
      decisionId: decision.id,
      verdict: decision.verdict,
      txHash: decision.txHash,
      logIndex: decision.logIndex,
    });
    enqueued += 1;
    log.info({ decisionId: decision.id, agent: decision.agent }, "backfill score job enqueued");
  }

  return enqueued;
}
