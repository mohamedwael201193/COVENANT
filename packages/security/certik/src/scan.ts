import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";
import { runCertikScan } from "./adapter.js";
import type { CertikAdapterConfig, CertikScanResult } from "./types.js";

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../../..");

loadDotenv({ path: resolve(MONOREPO_ROOT, ".env") });

const configSchema = z.object({
  CERTIK_SCANNER_URL: z.string().optional(),
  CERTIK_SCANNER_API_KEY: z.string().optional(),
  CERTIK_SCANNER_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

export function loadCertikConfig(env: NodeJS.ProcessEnv = process.env): CertikAdapterConfig {
  const parsed = configSchema.parse(env);
  return {
    scannerUrl: parsed.CERTIK_SCANNER_URL,
    apiKey: parsed.CERTIK_SCANNER_API_KEY,
    enabled: parsed.CERTIK_SCANNER_ENABLED ?? false,
  };
}

export async function scanRepository(
  repositoryRoot: string = MONOREPO_ROOT,
  paths?: string[],
): Promise<CertikScanResult> {
  return runCertikScan(loadCertikConfig(), { repositoryRoot, paths });
}

export { MONOREPO_ROOT };
