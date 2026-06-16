import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { createRedisConnection } from "../src/queue.js";

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../..");
loadDotenv({ path: resolve(MONOREPO_ROOT, ".env") });

async function main(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error("REDIS_URL is not set");
    process.exit(1);
  }

  const redis = createRedisConnection(redisUrl);
  const pong = await redis.ping();
  await redis.set("covenant:indexer:validate", "ok", "EX", 30);
  const val = await redis.get("covenant:indexer:validate");
  redis.disconnect();

  if (pong !== "PONG" || val !== "ok") {
    console.error("Redis validation failed");
    process.exit(1);
  }

  console.log("Redis connection OK");
}

main().catch((err) => {
  console.error("Redis validation failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
