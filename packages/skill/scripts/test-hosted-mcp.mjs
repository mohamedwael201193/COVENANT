#!/usr/bin/env node
/** Smoke test hosted Covenant MCP JSON-RPC endpoint. */
const MCP_URL = process.env.COVENANT_MCP_URL ?? "https://covenant-skill.onrender.com/mcp";

let id = 1;
async function rpc(method, params = {}) {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: id++, method, params }),
  });
  const body = await res.json();
  if (!res.ok || body.error) {
    throw new Error(JSON.stringify(body.error ?? body));
  }
  return body.result;
}

console.log("MCP:", MCP_URL);
const init = await rpc("initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "covenant-hosted-smoke", version: "1.0.0" },
});
console.log("initialize:", init.serverInfo);

const tools = await rpc("tools/list");
console.log("tools:", tools.tools.length);
if (tools.tools.length < 17) throw new Error(`Expected at least 17 tools, got ${tools.tools.length}`);

const health = await rpc("tools/call", { name: "covenant_health", arguments: {} });
console.log("health:", health.content?.[0]?.text ?? health);
console.log("PASS");
