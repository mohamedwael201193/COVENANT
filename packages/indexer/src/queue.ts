import { Redis } from "ioredis";
import { Queue, Worker, type ConnectionOptions, type Job } from "bullmq";
import type { Logger } from "pino";
import { jobIdForLog, toStoredPayload, type RawLogPayload, type StoredLogPayload } from "./types.js";

export const QUEUE_INGEST = "covenant-ingest";
export const QUEUE_SCORE = "covenant-score";
export const QUEUE_CACHE_WARM = "covenant-cache-warm";

export interface IngestJobData {
  payload: StoredLogPayload;
}

export interface ScoreJobData {
  agent: string;
  decisionId?: string;
  verdict?: number;
  breachIntentHash?: string;
  txHash: string;
  logIndex: number;
}

export interface CacheWarmJobData {
  agent: string;
}

export function createRedisConnection(redisUrl: string): Redis {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

function connectionOptions(redis: Redis): ConnectionOptions {
  return redis as unknown as ConnectionOptions;
}

export interface QueueBundle {
  redis: Redis;
  ingest: Queue<IngestJobData>;
  score: Queue<ScoreJobData>;
  cacheWarm: Queue<CacheWarmJobData>;
}

export function createQueues(redisUrl: string): QueueBundle {
  const redis = createRedisConnection(redisUrl);
  const connection = connectionOptions(redis);

  return {
    redis,
    ingest: new Queue<IngestJobData>(QUEUE_INGEST, { connection }),
    score: new Queue<ScoreJobData>(QUEUE_SCORE, { connection }),
    cacheWarm: new Queue<CacheWarmJobData>(QUEUE_CACHE_WARM, { connection }),
  };
}

export async function enqueueIngest(
  queues: QueueBundle,
  payload: RawLogPayload,
): Promise<void> {
  const jobId = jobIdForLog(payload.txHash, payload.logIndex);
  await queues.ingest.add("project", { payload: toStoredPayload(payload) }, { jobId, removeOnComplete: 1000, removeOnFail: 5000 });
}

export async function enqueueScore(
  queues: QueueBundle,
  data: ScoreJobData,
): Promise<void> {
  const jobId = jobIdForLog(data.txHash, data.logIndex);
  await queues.score.add("score", data, { jobId, removeOnComplete: 1000, removeOnFail: 5000 });
}

export async function enqueueCacheWarm(queues: QueueBundle, agent: string): Promise<void> {
  await queues.cacheWarm.add(
    "warm",
    { agent: agent.toLowerCase() },
    { jobId: `warm:${agent.toLowerCase()}`, removeOnComplete: 100, removeOnFail: 500 },
  );
}

export async function closeQueues(queues: QueueBundle): Promise<void> {
  await Promise.all([queues.ingest.close(), queues.score.close(), queues.cacheWarm.close()]);
  queues.redis.disconnect();
}

export interface WorkerHandlers {
  onIngest: (job: Job<IngestJobData>) => Promise<void>;
  onScore: (job: Job<ScoreJobData>) => Promise<void>;
  onCacheWarm: (job: Job<CacheWarmJobData>) => Promise<void>;
}

export interface WorkerBundle {
  ingest: Worker<IngestJobData>;
  score: Worker<ScoreJobData>;
  cacheWarm: Worker<CacheWarmJobData>;
}

export function createWorkers(
  redisUrl: string,
  handlers: WorkerHandlers,
  log: Logger,
): WorkerBundle {
  const connection = connectionOptions(createRedisConnection(redisUrl));

  const ingest = new Worker<IngestJobData>(
    QUEUE_INGEST,
    async (job) => handlers.onIngest(job),
    { connection, concurrency: 4 },
  );

  const score = new Worker<ScoreJobData>(
    QUEUE_SCORE,
    async (job) => handlers.onScore(job),
    { connection, concurrency: 2 },
  );

  const cacheWarm = new Worker<CacheWarmJobData>(
    QUEUE_CACHE_WARM,
    async (job) => handlers.onCacheWarm(job),
    { connection, concurrency: 2 },
  );

  for (const worker of [ingest, score, cacheWarm]) {
    worker.on("failed", (job, err) => {
      log.error({ jobId: job?.id, err }, "queue job failed");
    });
  }

  return { ingest, score, cacheWarm };
}

export async function closeWorkers(workers: WorkerBundle): Promise<void> {
  await Promise.all([workers.ingest.close(), workers.score.close(), workers.cacheWarm.close()]);
}

export function reputationCacheKey(agent: string): string {
  return `covenant:rep:${agent.toLowerCase()}`;
}
