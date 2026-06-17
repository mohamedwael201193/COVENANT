#!/usr/bin/env node
/** Wrapper — runs MCP stdio smoke test from packages/skill. */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const script = resolve(dirname(fileURLToPath(import.meta.url)), "../packages/skill/scripts/test-mcp-stdio.mjs");
const args = process.argv.slice(2);
const r = spawnSync(process.execPath, [script, ...args], { stdio: "inherit", env: process.env });
process.exit(r.status ?? 1);
