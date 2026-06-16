import { abis } from "@covenant/shared";
import type { Logger } from "pino";
import { verdictLabel } from "../engine/schema.js";
import { publishDecisionEvent } from "../http/sse.js";
import type { ChainClients } from "./clients.js";
import { readDecision } from "./clients.js";

export function startDecisionWatcher(clients: ChainClients, log: Logger): () => void {
  const unwatch = clients.publicClient.watchContractEvent({
    address: clients.contracts.decisionLog,
    abi: abis.decisionLog,
    eventName: "DecisionLogged",
    onLogs: async (logs) => {
      for (const entry of logs) {
        const id = (entry as unknown as { args: { id: bigint } }).args.id;
        try {
          const row = await readDecision(clients, id);
          publishDecisionEvent({
            id: id.toString(),
            agent: row.agent,
            verdict: verdictLabel(row.verdict as 0 | 1 | 2),
            intentHash: row.intentHash,
            timestamp: row.timestamp.toString(),
          });
        } catch (error) {
          log.error({ err: error, decisionId: id.toString() }, "failed to publish decision event");
        }
      }
    },
    onError: (error) => {
      log.error({ err: error }, "decision watcher error");
    },
  });

  log.info("DecisionLog watcher started");
  return unwatch;
}
