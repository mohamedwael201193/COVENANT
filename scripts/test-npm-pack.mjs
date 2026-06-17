#!/usr/bin/env node
/** Pack and install @covenant/* tarballs into an isolated temp dir (clean-machine simulation). */
import { mkdtempSync, rmSync, cpSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = mkdtempSync(join(tmpdir(), "covenant-npm-test-"));
console.log("Temp dir:", tmp);

function run(cmd, cwd = tmp) {
  console.log(">", cmd);
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
}

try {
  const sharedTgz = execSync("npm pack", {
    cwd: join(root, "packages/shared"),
    encoding: "utf8",
  }).trim();
  const skillTgz = execSync("npm pack", {
    cwd: join(root, "packages/skill"),
    encoding: "utf8",
  }).trim();
  const mcpTgz = execSync("npm pack", {
    cwd: join(root, "packages/mcp"),
    encoding: "utf8",
  }).trim();

  cpSync(join(root, "packages/shared", sharedTgz), join(tmp, sharedTgz));
  cpSync(join(root, "packages/skill", skillTgz), join(tmp, skillTgz));
  cpSync(join(root, "packages/mcp", mcpTgz), join(tmp, mcpTgz));

  run("npm init -y");
  run(`npm install ${sharedTgz} ${skillTgz} ${mcpTgz}`);

  execSync(`node "${resolve(root, "scripts/test-mcp-stdio.mjs")}" pack`, {
    cwd: tmp,
    stdio: "inherit",
    env: {
      ...process.env,
      PHAROS_RPC_URL: "https://atlantic-rpc.pharosnetwork.xyz",
    },
  });

  console.log("\nPASS: isolated tarball install + tools/list");
} finally {
  try {
    rmSync(tmp, { recursive: true, force: true });
  } catch {
    console.log("cleanup skipped:", tmp);
  }
}
