#!/usr/bin/env node
/** One-command COVENANT MCP setup. Usage: npx covenant-mcp init */
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const cwd = process.cwd();
const envPath = resolve(cwd, ".env.covenant");
const example = `# COVENANT MCP — load via MCP client env block or: set -a && source .env.covenant
PHAROS_RPC_URL=https://atlantic-rpc.pharosnetwork.xyz
GOPLUS_APP_KEY=
GOPLUS_APP_SECRET=
DEPLOYER_PRIVATE_KEY=0x
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

const mcpJson = {
  mcpServers: {
    covenant: {
      command: "npx",
      args: ["-y", "covenant-mcp"],
      env: {
        PHAROS_RPC_URL: "https://atlantic-rpc.pharosnetwork.xyz",
        GOPLUS_APP_KEY: "YOUR_GOPLUS_APP_KEY",
        GOPLUS_APP_SECRET: "YOUR_GOPLUS_APP_SECRET",
        DEPLOYER_PRIVATE_KEY: "0xYOUR_ATTESTER_PRIVATE_KEY",
        PREFLIGHT_LLM_ENABLED: "false",
      },
    },
  },
};

const cursorPath = resolve(cursorDir, "mcp.json.example");
writeFileSync(cursorPath, JSON.stringify(mcpJson, null, 2) + "\n", "utf8");
console.log("Wrote", cursorPath);
console.log("\nNext: fill .env.covenant, copy mcp.json.example → mcp.json, restart your MCP client.");
console.log("Verify: npx covenant-mcp  (stdio server — Ctrl+C to exit)");
