import { prisma } from "../db/client.js";
import type { RawLogPayload } from "../types.js";

function lower(addr: string): string {
  return addr.toLowerCase();
}

export async function projectDecisionLogged(payload: RawLogPayload): Promise<void> {
  if (payload.event.kind !== "DecisionLogged") return;
  const { id, agent, intentHash, verdict, reasonHash, outcomeHash } = payload.event;

  await prisma.agent.upsert({
    where: { address: lower(agent) },
    create: {
      address: lower(agent),
      owner: lower(agent),
      metadataUri: "",
      registeredAt: payload.blockTimestamp,
      lastActive: payload.blockTimestamp,
    },
    update: { lastActive: payload.blockTimestamp },
  });

  await prisma.decision.upsert({
    where: {
      txHash_logIndex: {
        txHash: lower(payload.txHash),
        logIndex: payload.logIndex,
      },
    },
    create: {
      id,
      agent: lower(agent),
      intentHash: lower(intentHash),
      verdict,
      reasonHash: lower(reasonHash),
      outcomeHash: lower(outcomeHash),
      blockNumber: payload.blockNumber,
      txHash: lower(payload.txHash),
      logIndex: payload.logIndex,
      ts: payload.blockTimestamp,
    },
    update: {
      verdict,
      reasonHash: lower(reasonHash),
      outcomeHash: lower(outcomeHash),
    },
  });
}
