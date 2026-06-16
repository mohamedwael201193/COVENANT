import type { Express, Request, Response } from "express";
import type { Logger } from "pino";
import { EventEmitter } from "node:events";

export interface DecisionEvent {
  id: string;
  agent: string;
  verdict: string;
  intentHash: string;
  timestamp: string;
}

const bus = new EventEmitter();
bus.setMaxListeners(100);

export function publishDecisionEvent(event: DecisionEvent): void {
  bus.emit("decision", event);
}

export function registerSseRoutes(app: Express, log: Logger): void {
  app.get("/api/events/decisions", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (event: DecisionEvent) => {
      res.write(`event: decision\ndata: ${JSON.stringify(event)}\n\n`);
    };

    const heartbeat = setInterval(() => {
      res.write(": ping\n\n");
    }, 30_000);

    bus.on("decision", send);

    req.on("close", () => {
      clearInterval(heartbeat);
      bus.off("decision", send);
      log.debug("SSE client disconnected");
    });
  });
}

export { bus as decisionEventBus };
