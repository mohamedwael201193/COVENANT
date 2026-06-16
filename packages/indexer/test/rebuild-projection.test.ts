import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { Verdict } from "@covenant/shared";
import { prisma, disconnectDb } from "../src/db/client.js";
import { clearProjections, projectLog } from "../src/projectors/index.js";
import type { RawLogPayload } from "../src/types.js";

const hasDb = Boolean(process.env.DATABASE_URL);
let dbReachable = false;

function fixture(overrides: Partial<RawLogPayload> & { event: RawLogPayload["event"] }): RawLogPayload {
  return {
    txHash: overrides.txHash ?? "0x1111111111111111111111111111111111111111111111111111111111111111",
    logIndex: overrides.logIndex ?? 0,
    blockNumber: overrides.blockNumber ?? 100n,
    blockTimestamp: overrides.blockTimestamp ?? new Date("2025-06-01T00:00:00Z"),
    event: overrides.event,
  };
}

describe.skipIf(!hasDb)("rebuild projection", () => {
  beforeAll(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbReachable = true;
      await clearProjections();
    } catch {
      dbReachable = false;
    }
  });

  afterAll(async () => {
    if (dbReachable) await clearProjections();
    await disconnectDb();
  });

  it.skipIf(!dbReachable)("replays events into consistent projections", async () => {
    const agent = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const owner = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    const events: RawLogPayload[] = [
      fixture({
        txHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
        logIndex: 0,
        event: {
          kind: "AgentRegistered",
          owner,
          agent,
          metadataUri: "ipfs://agent-meta",
        },
      }),
      fixture({
        txHash: "0x3333333333333333333333333333333333333333333333333333333333333333",
        logIndex: 1,
        event: {
          kind: "CovenantSet",
          owner,
          agent,
          covenantHash: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
          tierCurveRef: "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          ipfsUri: "ipfs://covenant",
        },
      }),
      fixture({
        txHash: "0x4444444444444444444444444444444444444444444444444444444444444444",
        logIndex: 2,
        blockNumber: 101n,
        event: {
          kind: "DecisionLogged",
          id: "42",
          agent,
          intentHash: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
          verdict: Verdict.ALLOW,
          reasonHash: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
          outcomeHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
        },
      }),
    ];

    for (const payload of events) {
      await projectLog(payload);
    }

    const agentRow = await prisma.agent.findUnique({ where: { address: agent } });
    expect(agentRow?.metadataUri).toBe("ipfs://agent-meta");

    const covenantCount = await prisma.covenant.count({ where: { agent } });
    expect(covenantCount).toBe(1);

    const decision = await prisma.decision.findUnique({ where: { id: "42" } });
    expect(decision?.verdict).toBe(Verdict.ALLOW);

    await clearProjections();
    for (const payload of events) {
      await projectLog(payload);
    }

    const replayDecision = await prisma.decision.findUnique({ where: { id: "42" } });
    expect(replayDecision?.verdict).toBe(Verdict.ALLOW);
  });
});
