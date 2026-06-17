#!/usr/bin/env node
/** One-command COVENANT MCP setup. Usage: npx covenant-mcp init */
import { writeFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cwd = process.cwd();
const envPath = resolve(cwd, ".env.covenant");
const example = `# COVENANT MCP — optional overrides (zero secrets required for read/evaluate tools)
# PHAROS_RPC_URL=https://atlantic.dplabs-internal.com
# COVENANT_API_URL=https://covenant-skill.onrender.com
PREFLIGHT_LLM_ENABLED=false
`;

if (!existsSync(envPath)) {
  writeFileSync(envPath, example, "utf8");
  console.log("Created", envPath);
} else {
  console.log("Exists", envPath, "— skipping");
}

const cursorDir = resolve(cwd, ".cursor");
if (!existsSync(cursorDir)) mkdirSync(cursorDir, { recursive: true });

const cursorTemplate = resolve(pkgRoot, "config/cursor.mcp.json");
const mcpJson = existsSync(cursorTemplate)
  ? readFileSync(cursorTemplate, "utf8")
  : JSON.stringify(
      {
        mcpServers: {
          covenant: {
            command: "npx",
            args: ["-y", "covenant-mcp"],
            env: { PREFLIGHT_LLM_ENABLED: "false" },
          },
        },
      },
      null,
      2,
    ) + "\n";

const cursorExamplePath = resolve(cursorDir, "mcp.json.example");
const cursorPath = resolve(cursorDir, "mcp.json");
writeFileSync(cursorExamplePath, mcpJson, "utf8");
console.log("Wrote", cursorExamplePath);
if (!existsSync(cursorPath)) {
  writeFileSync(cursorPath, mcpJson, "utf8");
  console.log("Created", cursorPath);
} else {
  console.log("Exists", cursorPath, "— leaving your MCP config unchanged");
}
console.log("\nZero-secret setup complete. Restart your MCP client to load Covenant.");
console.log("Verify: npx covenant-mcp  (stdio server — Ctrl+C to exit)");
