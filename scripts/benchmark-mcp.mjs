#!/usr/bin/env node
/** Wrapper — runs benchmark from packages/skill where MCP SDK is installed. */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const script = resolve(dirname(fileURLToPath(import.meta.url)), "../packages/skill/scripts/benchmark-mcp.mjs");
const r = spawnSync(process.execPath, [script], { stdio: "inherit", env: process.env });
process.exit(r.status ?? 1);
