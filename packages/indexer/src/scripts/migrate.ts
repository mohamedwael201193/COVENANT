import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

execSync("pnpm exec prisma migrate deploy", {
  stdio: "inherit",
  cwd: resolve(root, "packages/indexer"),
  env: process.env,
});

console.log("Prisma migrations applied");
