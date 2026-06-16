import express, { type Express } from "express";
import cors from "cors";
import type { Logger } from "pino";
import { verdictLabel } from "../engine/schema.js";
import type { PreflightServices } from "../engine/preflight.js";
import { runPreflight } from "../engine/preflight.js";
import {
  preflightRequestSchema,
  simulateRequestSchema,
  reputationSchema,
  getReceiptSchema,
} from "../engine/schema.js";
import { simulateIntent } from "../engine/simulator.js";
import { readDecision, readReputation } from "../chain/clients.js";
import type { ChainClients } from "../chain/clients.js";
import {
  listAgents,
  listAgentsWithReputation,
  listCovenants,
  listDecisions,
} from "../chain/indexer.js";
import { handleSetCovenant } from "../tools/index.js";
import { setCovenantSchema } from "../engine/schema.js";
import { registerHealthRoutes, collectHealthState } from "./health.js";
import { registerSseRoutes } from "./sse.js";

export interface RestContext {
  clients: ChainClients;
  services: PreflightServices;
  log: Logger;
}

export function createRestApp(ctx: RestContext): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "256kb" }));

  registerHealthRoutes(app, () => collectHealthState(ctx.clients), ctx.log);
  registerSseRoutes(app, ctx.log);

  app.get("/api/agents", async (_req, res) => {
    try {
      const agents = await listAgents(ctx.clients);
      res.json({ agents });
    } catch (error) {
      ctx.log.error({ err: error }, "list agents failed");
      res.status(500).json({ error: error instanceof Error ? error.message : "list agents failed" });
    }
  });

  app.get("/api/covenants", async (_req, res) => {
    try {
      const covenants = await listCovenants(ctx.clients);
      res.json({ covenants });
    } catch (error) {
      ctx.log.error({ err: error }, "list covenants failed");
      res.status(500).json({ error: error instanceof Error ? error.message : "list covenants failed" });
    }
  });

  app.post("/api/covenants", async (req, res) => {
    const parsed = setCovenantSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const result = await handleSetCovenant(ctx.clients, parsed.data);
      res.status(201).json(result);
    } catch (error) {
      ctx.log.error({ err: error }, "set covenant failed");
      res.status(500).json({ error: error instanceof Error ? error.message : "set covenant failed" });
    }
  });

  app.get("/api/decisions", async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    if (!Number.isFinite(limit) || limit < 1) {
      res.status(400).json({ error: "limit must be a positive number" });
      return;
    }
    try {
      const result = await listDecisions(ctx.clients, limit);
      res.json(result);
    } catch (error) {
      ctx.log.error({ err: error }, "list decisions failed");
      res.status(500).json({ error: error instanceof Error ? error.message : "list decisions failed" });
    }
  });

  app.get("/api/reputation", async (_req, res) => {
    try {
      const agents = await listAgentsWithReputation(ctx.clients);
      res.json({ agents });
    } catch (error) {
      ctx.log.error({ err: error }, "list reputation failed");
      res.status(500).json({ error: error instanceof Error ? error.message : "list reputation failed" });
    }
  });

  app.post("/api/preflight", async (req, res) => {
    const parsed = preflightRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const result = await runPreflight(ctx.services, parsed.data);
      res.json({
        ...result,
        verdict: verdictLabel(result.verdict),
        intentHash: result.intentHash,
        attestation: result.attestation
          ? {
              ...result.attestation,
              deadline: result.attestation.deadline.toString(),
            }
          : undefined,
        simulation: {
          ...result.simulation,
          gasEstimate: result.simulation.gasEstimate?.toString(),
        },
      });
    } catch (error) {
      ctx.log.error({ err: error }, "preflight failed");
      res.status(500).json({ error: error instanceof Error ? error.message : "preflight failed" });
    }
  });

  app.post("/api/simulate", async (req, res) => {
    const parsed = simulateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const result = await simulateIntent(ctx.clients, {
        agent: parsed.data.intent.agent as `0x${string}`,
        target: parsed.data.intent.target as `0x${string}`,
        data: parsed.data.intent.data as `0x${string}`,
        value: parsed.data.intent.value,
        nonce: parsed.data.intent.nonce,
      }, parsed.data.from as `0x${string}` | undefined);
      res.json({
        ...result,
        gasEstimate: result.gasEstimate?.toString(),
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "simulate failed" });
    }
  });

  app.get("/api/reputation/:agent", async (req, res) => {
    const parsed = reputationSchema.safeParse({ agent: req.params.agent });
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const rep = await readReputation(ctx.clients, parsed.data.agent as `0x${string}`);
      res.json({
        agent: parsed.data.agent,
        score: rep.score.toString(),
        tier: rep.tier,
        updatedAt: rep.updatedAt.toString(),
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "reputation read failed" });
    }
  });

  app.get("/api/receipt/:id", async (req, res) => {
    const parsed = getReceiptSchema.safeParse({ decisionId: req.params.id });
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const receipt = await readDecision(ctx.clients, parsed.data.decisionId);
      res.json({
        id: parsed.data.decisionId.toString(),
        ...receipt,
        timestamp: receipt.timestamp.toString(),
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "receipt read failed" });
    }
  });

  return app;
}
