#!/usr/bin/env node
import { runMcpCli } from "@covenant/skill/mcp";

runMcpCli().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
