import pino from "pino";
import { loadConfig, getChainConfig, resolveIndexerPort } from "./config.js";
import { disconnectDb } from "./db/client.js";
import {
  closeQueues,
  closeWorkers,
  createQueues,
  createWorkers,
} from "./queue.js";
import { startWatcher } from "./watcher.js";
import { createRestApp } from "./http/rest.js";
import {
  createCacheWarmHandler,
  createIngestHandler,
  createScoreHandler,
} from "./workers.js";

const log = pino({ name: "covenant-indexer" });

async function main(): Promise<void> {
  const env = loadConfig();
  const chain = getChainConfig();
  const queues = createQueues(env.REDIS_URL);

  const workerCtx = { env, queues, log };
  const workers = createWorkers(
    env.REDIS_URL,
    {
      onIngest: createIngestHandler(workerCtx),
      onScore: createScoreHandler(workerCtx),
      onCacheWarm: createCacheWarmHandler(workerCtx),
    },
    log,
  );

  const watcher = startWatcher({ env, chain, queues, log });
  const app = createRestApp({ log, client: watcher.client, queues });

  const port = resolveIndexerPort(env);
  const server = app.listen(port, env.INDEXER_HTTP_HOST, () => {
    log.info({ port, chainId: chain.chainId }, "indexer started");
  });

  const shutdown = async (signal: string) => {
    log.info({ signal }, "shutting down");
    watcher.stop();
    server.close();
    await closeWorkers(workers);
    await closeQueues(queues);
    await disconnectDb();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  log.fatal({ err }, "indexer boot failed");
  process.exit(1);
});
