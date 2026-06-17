#!/usr/bin/env node
import { runMcpCli } from "covenant-skill/mcp";

const sub = process.argv[2];

if (sub === "init") {
  const { pathToFileURL } = await import("node:url");
  const { resolve, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const initPath = resolve(dirname(fileURLToPath(import.meta.url)), "../scripts/init.mjs");
  await import(pathToFileURL(initPath).href);
} else {
  await runMcpCli();
}
