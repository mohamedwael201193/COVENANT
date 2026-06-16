import { prisma } from "../db/client.js";
import type { RawLogPayload } from "../types.js";

function lower(addr: string): string {
  return addr.toLowerCase();
}

export async function projectAgentRegistered(payload: RawLogPayload): Promise<void> {
  if (payload.event.kind !== "AgentRegistered") return;
  const { owner, agent, metadataUri } = payload.event;
  const ts = payload.blockTimestamp;

  await prisma.agent.upsert({
    where: { address: lower(agent) },
    create: {
      address: lower(agent),
      owner: lower(owner),
      metadataUri,
      registeredAt: ts,
      lastActive: ts,
      revoked: false,
    },
    update: {
      owner: lower(owner),
      metadataUri,
      lastActive: ts,
      revoked: false,
    },
  });
}
