import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../..");
loadDotenv({ path: resolve(MONOREPO_ROOT, ".env") });

const args = process.argv.slice(2);
const result = spawnSync("prisma", args, {
  stdio: "inherit",
  shell: true,
  cwd: resolve(import.meta.dirname, ".."),
  env: process.env,
});

process.exit(result.status ?? 1);
