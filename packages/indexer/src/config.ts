import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";
import { loadChainConfig, PHAROS_ATLANTIC_CHAIN_ID } from "@covenant/shared";

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../..");

loadDotenv({ path: resolve(MONOREPO_ROOT, ".env") });

const hexAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/)
  .transform((v) => v.toLowerCase() as `0x${string}`);

const privateKey = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/)
  .transform((v) => v as `0x${string}`);

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  PHAROS_CHAIN_ID: z.coerce.number().default(PHAROS_ATLANTIC_CHAIN_ID),
  PHAROS_RPC_URL: z.string().url(),
  PHAROS_RPC_URL_FALLBACK: z.string().url().optional(),
  DEPLOYER_PRIVATE_KEY: privateKey.optional(),
  INDEXER_START_BLOCK: z.coerce.bigint().default(0n),
  INDEXER_POLL_INTERVAL_MS: z.coerce.number().default(12_000),
  INDEXER_HTTP_PORT: z.coerce.number().optional(),
  INDEXER_HTTP_HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().optional(),
  INDEXER_ORACLE_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  IDENTITY_REGISTRY_ADDRESS: hexAddress.optional(),
  COVENANT_REGISTRY_ADDRESS: hexAddress.optional(),
  DECISION_LOG_ADDRESS: hexAddress.optional(),
  REPUTATION_REGISTRY_ADDRESS: hexAddress.optional(),
  GUARDED_EXECUTOR_ADDRESS: hexAddress.optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function loadConfig(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid indexer environment:\n${issues}`);
  }
  return parsed.data;
}

export function resolveIndexerPort(env: EnvConfig): number {
  // INDEXER_HTTP_PORT wins over Render's PORT (combined skill+indexer on one service).
  if (env.INDEXER_HTTP_PORT !== undefined) {
    return env.INDEXER_HTTP_PORT;
  }
  return env.PORT ?? 8788;
}

export function getChainConfig() {
  return loadChainConfig(process.env);
}

export const monorepoRoot = MONOREPO_ROOT;
