import { prisma } from "../db/client.js";
import type { RawLogPayload } from "../types.js";

function lower(addr: string): string {
  return addr.toLowerCase();
}

export async function projectCovenantBreached(payload: RawLogPayload): Promise<void> {
  if (payload.event.kind !== "CovenantBreached") return;
  const { agent } = payload.event;

  await prisma.agent.updateMany({
    where: { address: lower(agent) },
    data: { lastActive: payload.blockTimestamp },
  });

  await prisma.obligation.create({
    data: {
      agent: lower(agent),
      counterparty: "0x0000000000000000000000000000000000000000",
      amount: 0n,
      status: "breached",
      settledTx: lower(payload.txHash),
      ts: payload.blockTimestamp,
    },
  });
}
