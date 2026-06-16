import type { Prisma } from "@prisma/client";
import { prisma } from "../db/client.js";
import type { RawLogPayload } from "../types.js";
import { projectAgentRegistered } from "./agent.js";
import { projectCovenantBreached } from "./breach.js";
import { projectCovenantSet } from "./covenant.js";
import { projectDecisionLogged } from "./decision.js";
import { projectReputationUpdated } from "./reputation.js";

function lower(addr: string): string {
  return addr.toLowerCase();
}

export { projectAgentRegistered } from "./agent.js";
export { projectCovenantSet } from "./covenant.js";
export { projectDecisionLogged } from "./decision.js";
export { projectReputationUpdated } from "./reputation.js";
export { projectCovenantBreached } from "./breach.js";

export async function markLogProcessed(txHash: string, logIndex: number): Promise<void> {
  await prisma.processedLog.upsert({
    where: {
      txHash_logIndex: {
        txHash: lower(txHash),
        logIndex,
      },
    },
    create: { txHash: lower(txHash), logIndex },
    update: {},
  });
}

export async function isLogProcessed(txHash: string, logIndex: number): Promise<boolean> {
  const row = await prisma.processedLog.findUnique({
    where: {
      txHash_logIndex: {
        txHash: lower(txHash),
        logIndex,
      },
    },
  });
  return row !== null;
}

export async function projectLog(payload: RawLogPayload): Promise<void> {
  switch (payload.event.kind) {
    case "AgentRegistered":
      await projectAgentRegistered(payload);
      break;
    case "CovenantSet":
      await projectCovenantSet(payload);
      break;
    case "DecisionLogged":
      await projectDecisionLogged(payload);
      break;
    case "ReputationUpdated":
      await projectReputationUpdated(payload);
      break;
    case "CovenantBreached":
      await projectCovenantBreached(payload);
      break;
  }
  await markLogProcessed(payload.txHash, payload.logIndex);
}

export async function clearProjections(): Promise<void> {
  const tables: Prisma.PrismaPromise<unknown>[] = [
    prisma.reputationSource.deleteMany(),
    prisma.reputation.deleteMany(),
    prisma.obligation.deleteMany(),
    prisma.decision.deleteMany(),
    prisma.covenant.deleteMany(),
    prisma.agent.deleteMany(),
    prisma.processedLog.deleteMany(),
  ];
  await prisma.$transaction(tables);
}
