#!/usr/bin/env node
/** Publish covenant-shared → covenant-skill → covenant-mcp to npm (requires NPM_TOKEN). */
import { execSync } from "node:child_process";
import { cpSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const license = resolve(root, "LICENSE");
const VERSION = "0.2.4";

if (!process.env.NPM_TOKEN) {
  console.error("Set NPM_TOKEN environment variable before publishing.");
  process.exit(1);
}

function publish(pkg, resolveWorkspace = false) {
  const dir = resolve(root, "packages", pkg);
  const pkgJsonPath = resolve(dir, "package.json");
  const original = readFileSync(pkgJsonPath, "utf8");
  cpSync(license, resolve(dir, "LICENSE"));
  const npmrcPath = resolve(dir, ".npmrc.publish");
  writeFileSync(npmrcPath, `//registry.npmjs.org/:_authToken=${process.env.NPM_TOKEN}\n`);

  if (resolveWorkspace) {
    writeFileSync(
      pkgJsonPath,
      original.replace(/workspace:\*/g, VERSION).replace(/"workspace:\^"/g, `"${VERSION}"`),
    );
  }

  console.log("\n=== Publishing", `covenant-${pkg}@${VERSION}`, "===");
  try {
    execSync("npm publish --access public --userconfig .npmrc.publish", {
      cwd: dir,
      stdio: "inherit",
    });
  } finally {
    writeFileSync(pkgJsonPath, original);
    rmSync(npmrcPath, { force: true });
  }
}

execSync("pnpm install", { cwd: root, stdio: "inherit" });
execSync("pnpm --filter covenant-shared build", { cwd: root, stdio: "inherit" });
execSync("pnpm --filter covenant-skill build", { cwd: root, stdio: "inherit" });
execSync("pnpm --filter covenant-mcp build", { cwd: root, stdio: "inherit" });

publish("shared", false);
publish("skill", true);
publish("mcp", true);

console.log("\nDone. Verify: npm view covenant-mcp && npx -y covenant-mcp init");
