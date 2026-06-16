import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";
import { loadChainConfig, PHAROS_ATLANTIC_CHAIN_ID } from "@covenant/shared";

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../..");

loadDotenv({ path: resolve(MONOREPO_ROOT, ".env") });

const hexAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address")
  .transform((v) => v as `0x${string}`);

const privateKey = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid private key")
  .transform((v) => v as `0x${string}`);

export const envSchema = z.object({
  PHAROS_CHAIN_ID: z.coerce.number().default(PHAROS_ATLANTIC_CHAIN_ID),
  PHAROS_RPC_URL: z.string().url(),
  PHAROS_RPC_URL_FALLBACK: z.string().url().optional(),
  PHAROS_EXPLORER_URL: z.string().url().optional(),
  DEPLOYER_PRIVATE_KEY: privateKey,
  GOPLUS_APP_KEY: z.string().min(1),
  GOPLUS_APP_SECRET: z.string().min(1),
  GOPLUS_API_BASE: z.string().url().default("https://api.gopluslabs.io"),
  CEREBRAS_API_KEY: z.string().optional(),
  CEREBRAS_MODEL: z.string().optional(),
  SAMBANOVA_API_KEY: z.string().optional(),
  SAMBANOVA_MODEL: z.string().optional(),
  TOGETHER_API_KEY: z.string().optional(),
  TOGETHER_MODEL: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  PINATA_JWT: z.string().optional(),
  SKILL_SERVER_PORT: z.coerce.number().optional(),
  SKILL_SERVER_HOST: z.string().default("0.0.0.0"),
  MCP_STDIO_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  PORT: z.coerce.number().optional(),
  IDENTITY_REGISTRY_ADDRESS: hexAddress.optional(),
  COVENANT_REGISTRY_ADDRESS: hexAddress.optional(),
  DECISION_LOG_ADDRESS: hexAddress.optional(),
  REPUTATION_REGISTRY_ADDRESS: hexAddress.optional(),
  GUARDED_EXECUTOR_ADDRESS: hexAddress.optional(),
  ATTESTER_ADDRESS: hexAddress.optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function loadConfig(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

/** Render sets PORT; local dev uses SKILL_SERVER_PORT (default 8787). */
export function resolveSkillPort(env: EnvConfig): number {
  return env.PORT ?? env.SKILL_SERVER_PORT ?? 8787;
}

export function shouldEnableMcpStdio(env: EnvConfig): boolean {
  if (env.MCP_STDIO_ENABLED === true) return true;
  if (env.MCP_STDIO_ENABLED === false) return false;
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

export function getChainConfig() {
  return loadChainConfig(process.env);
}

export const monorepoRoot = MONOREPO_ROOT;
