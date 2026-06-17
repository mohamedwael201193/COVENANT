import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";
import { loadChainConfig, PHAROS_ATLANTIC_CHAIN_ID } from "@covenant/shared";

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../../..");

/** Load .env from cwd, then monorepo root (dev), then skip. */
export function loadMcpEnv(): void {
  loadDotenv({ path: resolve(process.cwd(), ".env") });
  loadDotenv({ path: resolve(MONOREPO_ROOT, ".env") });
}

const optionalKey = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/)
  .optional()
  .transform((v) => v as `0x${string}` | undefined);

export const mcpEnvSchema = z.object({
  PHAROS_CHAIN_ID: z.coerce.number().default(PHAROS_ATLANTIC_CHAIN_ID),
  PHAROS_RPC_URL: z.string().url(),
  PHAROS_RPC_URL_FALLBACK: z.string().url().optional(),
  DEPLOYER_PRIVATE_KEY: optionalKey,
  COVENANT_OWNER_PRIVATE_KEY: optionalKey,
  GOPLUS_APP_KEY: z.string().min(1).optional(),
  GOPLUS_APP_SECRET: z.string().min(1).optional(),
  GOPLUS_API_BASE: z.string().url().default("https://api.gopluslabs.io"),
  PREFLIGHT_LLM_ENABLED: z
    .string()
    .optional()
    .transform((v) => v !== "false" && v !== "0"),
  PREFLIGHT_LLM_TIMEOUT_MS: z.coerce.number().default(2500),
});

export type McpEnv = z.infer<typeof mcpEnvSchema>;

export function loadMcpConfig(): McpEnv {
  loadMcpEnv();
  const parsed = mcpEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`COVENANT MCP env invalid:\n${issues}`);
  }
  return parsed.data;
}

/** Private key for write tools: COVENANT_OWNER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY */
export function resolveOwnerPrivateKey(env: McpEnv): `0x${string}` | undefined {
  return env.COVENANT_OWNER_PRIVATE_KEY ?? env.DEPLOYER_PRIVATE_KEY;
}

export function getChainConfigFromMcpEnv() {
  return loadChainConfig(process.env);
}
