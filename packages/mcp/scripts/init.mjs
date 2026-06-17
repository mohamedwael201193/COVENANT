#!/usr/bin/env node
/**
 * One-command COVENANT MCP setup: writes .env.covenant + prints client config snippets.
 * Usage: npx @covenant/mcp init   OR   node packages/mcp/scripts/init.mjs
 */
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const envPath = resolve(root, ".env.covenant");
const example = `# COVENANT MCP — copy to .env or merge into your shell profile
PHAROS_RPC_URL=https://atlantic-rpc.pharosnetwork.xyz
PHAROS_RPC_URL_FALLBACK=https://testnet-rpc.pharosnetwork.xyz
GOPLUS_APP_KEY=
GOPLUS_APP_SECRET=
DEPLOYER_PRIVATE_KEY=0x...
PREFLIGHT_LLM_ENABLED=false
`;

if (!existsSync(envPath)) {
  writeFileSync(envPath, example, "utf8");
  console.log("Created", envPath);
} else {
  console.log("Exists", envPath, "— skipping");
}

const cursorDir = resolve(root, ".cursor");
if (!existsSync(cursorDir)) mkdirSync(cursorDir, { recursive: true });

const mcpJson = {
  mcpServers: {
    covenant: {
      command: "npx",
      args: ["-y", "@covenant/mcp"],
      env: {
        PHAROS_RPC_URL: "${PHAROS_RPC_URL}",
        GOPLUS_APP_KEY: "${GOPLUS_APP_KEY}",
        GOPLUS_APP_SECRET: "${GOPLUS_APP_SECRET}",
        DEPLOYER_PRIVATE_KEY: "${DEPLOYER_PRIVATE_KEY}",
        PREFLIGHT_LLM_ENABLED: "false",
      },
    },
  },
};

const cursorPath = resolve(cursorDir, "mcp.json.example");
writeFileSync(cursorPath, JSON.stringify(mcpJson, null, 2) + "\n", "utf8");
console.log("Wrote", cursorPath);
console.log("\nNext: fill .env.covenant, then add covenant to your MCP client (see packages/mcp/README.md)");
