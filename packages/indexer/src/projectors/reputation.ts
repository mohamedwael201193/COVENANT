import { prisma } from "../db/client.js";
import type { RawLogPayload } from "../types.js";

function lower(addr: string): string {
  return addr.toLowerCase();
}

export async function projectReputationUpdated(payload: RawLogPayload): Promise<void> {
  if (payload.event.kind !== "ReputationUpdated") return;
  const { agent, score, tier, decisionIds, repWriteId } = payload.event;
  const agentLower = lower(agent);

  await prisma.agent.upsert({
    where: { address: agentLower },
    create: {
      address: agentLower,
      owner: agentLower,
      metadataUri: "",
      registeredAt: payload.blockTimestamp,
      lastActive: payload.blockTimestamp,
    },
    update: { lastActive: payload.blockTimestamp },
  });

  await prisma.reputation.upsert({
    where: { agent: agentLower },
    create: {
      agent: agentLower,
      score,
      tier,
      updatedAt: payload.blockTimestamp,
    },
    update: {
      score,
      tier,
      updatedAt: payload.blockTimestamp,
    },
  });

  for (const decisionId of decisionIds) {
    await prisma.reputationSource.upsert({
      where: {
        repWriteId_decisionId: {
          repWriteId: lower(repWriteId),
          decisionId,
        },
      },
      create: {
        repWriteId: lower(repWriteId),
        decisionId,
        agent: agentLower,
      },
      update: {},
    });
  }
}
