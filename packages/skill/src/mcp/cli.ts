#!/usr/bin/env node
import { runMcpCli } from "./index.js";

runMcpCli().catch((err) => {
  console.error(err);
  process.exit(1);
});
