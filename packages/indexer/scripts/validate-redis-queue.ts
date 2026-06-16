import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { Queue, QueueEvents, Worker } from "bullmq";
import { createRedisConnection } from "../src/queue.js";

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../..");
loadDotenv({ path: resolve(MONOREPO_ROOT, ".env") });

async function main(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error("REDIS_URL is not set");
    process.exit(1);
  }

  const connection = createRedisConnection(redisUrl);
  console.log("PING:", await connection.ping());

  const queueName = `covenant-validate-${Date.now()}`;
  const queue = new Queue(queueName, { connection: createRedisConnection(redisUrl) });
  const events = new QueueEvents(queueName, { connection: createRedisConnection(redisUrl) });

  let received: string | null = null;
  const worker = new Worker(
    queueName,
    async (job) => {
      received = String(job.data.payload);
    },
    { connection: createRedisConnection(redisUrl) },
  );

  await events.waitUntilReady();
  await worker.waitUntilReady();

  const job = await queue.add("probe", { payload: "covenant-redis-ok" });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), 15_000);
    events.on("completed", ({ jobId }) => {
      if (jobId === job.id) {
        clearTimeout(timer);
        resolve();
      }
    });
  });

  await worker.close();
  await events.close();
  await queue.close();
  connection.disconnect();

  if (received !== "covenant-redis-ok") {
    console.error("DEQUEUE FAILED received=", received);
    process.exit(1);
  }

  console.log("ENQUEUE: ok jobId=" + job.id);
  console.log("DEQUEUE: ok payload=covenant-redis-ok");
}

main().catch((err) => {
  console.error("Redis queue validation failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
