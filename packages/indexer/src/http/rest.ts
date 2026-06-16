import express, { type Express } from "express";
import cors from "cors";
import type { Logger } from "pino";
import type { PublicClient } from "viem";
import { prisma } from "../db/client.js";
import { INDEXER_STATE_LAST_BLOCK } from "../types.js";
import { reputationCacheKey, type QueueBundle } from "../queue.js";

export interface RestContext {
  log: Logger;
  client: PublicClient;
  queues: QueueBundle;
}

export function createRestApp(ctx: RestContext): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "128kb" }));

  app.get("/health", async (_req, res) => {
    try {
      const [dbOk, redisOk, stateRow, head] = await Promise.all([
        prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
        ctx.queues.redis.ping().then((r: string) => r === "PONG").catch(() => false),
        prisma.indexerState.findUnique({ where: { key: INDEXER_STATE_LAST_BLOCK } }),
        ctx.client.getBlockNumber(),
      ]);

      const lastBlock = stateRow ? BigInt(stateRow.value) : 0n;
      const lag = head > lastBlock ? head - lastBlock : 0n;

      res.status(dbOk && redisOk ? 200 : 503).json({
        status: dbOk && redisOk ? "ok" : "degraded",
        db: dbOk,
        redis: redisOk,
        lastIndexedBlock: lastBlock.toString(),
        chainHead: head.toString(),
        lag: lag.toString(),
      });
    } catch (err) {
      ctx.log.error({ err }, "health check failed");
      res.status(503).json({ status: "error" });
    }
  });

  app.get("/api/agents", async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const offset = Number(req.query.offset ?? 0);
    const agents = await prisma.agent.findMany({
      take: limit,
      skip: offset,
      orderBy: { registeredAt: "desc" },
    });
    res.json({ agents });
  });

  app.get("/api/agents/:address", async (req, res) => {
    const address = req.params.address.toLowerCase();
    const agent = await prisma.agent.findUnique({ where: { address } });
    if (!agent) {
      res.status(404).json({ error: "agent not found" });
      return;
    }
    res.json({ agent });
  });

  app.get("/api/covenants", async (req, res) => {
    const agent = typeof req.query.agent === "string" ? req.query.agent.toLowerCase() : undefined;
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const covenants = await prisma.covenant.findMany({
      where: agent ? { agent } : undefined,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    res.json({ covenants });
  });

  app.get("/api/decisions", async (req, res) => {
    const agent = typeof req.query.agent === "string" ? req.query.agent.toLowerCase() : undefined;
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const decisions = await prisma.decision.findMany({
      where: agent ? { agent } : undefined,
      take: limit,
      orderBy: { ts: "desc" },
    });
    res.json({
      decisions: decisions.map((d) => ({
        ...d,
        blockNumber: d.blockNumber.toString(),
      })),
    });
  });

  app.get("/api/reputation/:agent", async (req, res) => {
    const agent = req.params.agent.toLowerCase();
    const cached = await ctx.queues.redis.get(reputationCacheKey(agent));
    if (cached) {
      res.json({ source: "cache", reputation: JSON.parse(cached) });
      return;
    }
    const reputation = await prisma.reputation.findUnique({
      where: { agent },
      include: { sources: true },
    });
    if (!reputation) {
      res.json({ source: "db", reputation: { agent, score: "0", tier: 0 } });
      return;
    }
    res.json({
      source: "db",
      reputation: {
        ...reputation,
        score: reputation.score.toString(),
      },
    });
  });

  app.get("/api/obligations", async (req, res) => {
    const agent = typeof req.query.agent === "string" ? req.query.agent.toLowerCase() : undefined;
    const obligations = await prisma.obligation.findMany({
      where: agent ? { agent } : undefined,
      orderBy: { ts: "desc" },
      take: 100,
    });
    res.json({
      obligations: obligations.map((o) => ({
        ...o,
        amount: o.amount.toString(),
      })),
    });
  });

  return app;
}
