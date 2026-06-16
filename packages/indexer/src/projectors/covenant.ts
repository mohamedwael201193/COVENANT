import { prisma } from "../db/client.js";
import type { RawLogPayload } from "../types.js";

function lower(addr: string): string {
  return addr.toLowerCase();
}

export async function projectCovenantSet(payload: RawLogPayload): Promise<void> {
  if (payload.event.kind !== "CovenantSet") return;
  const { owner, agent, covenantHash, tierCurveRef, ipfsUri } = payload.event;

  await prisma.agent.upsert({
    where: { address: lower(agent) },
    create: {
      address: lower(agent),
      owner: lower(owner),
      metadataUri: "",
      registeredAt: payload.blockTimestamp,
      lastActive: payload.blockTimestamp,
    },
    update: {
      owner: lower(owner),
      lastActive: payload.blockTimestamp,
    },
  });

  await prisma.covenant.upsert({
    where: {
      txHash_logIndex: {
        txHash: lower(payload.txHash),
        logIndex: payload.logIndex,
      },
    },
    create: {
      agent: lower(agent),
      owner: lower(owner),
      covenantHash: lower(covenantHash),
      tierCurveRef: lower(tierCurveRef),
      ipfsUri,
      createdAt: payload.blockTimestamp,
      txHash: lower(payload.txHash),
      logIndex: payload.logIndex,
    },
    update: {
      covenantHash: lower(covenantHash),
      tierCurveRef: lower(tierCurveRef),
      ipfsUri,
    },
  });
}
