# Agent Integrations

## Claude Desktop / Claude Code

1. Copy [packages/mcp/config/claude-desktop.mcp.json](../../packages/mcp/config/claude-desktop.mcp.json) into Claude MCP settings.
2. Restart Claude.
3. Prompt:

```
You have COVENANT MCP tools. Before any Pharos payment:
1. covenant_reputation for the agent
2. covenant_preflight with intent + covenant
Only execute on-chain if verdict is ALLOW.
After tx, covenant_get_receipt.
```

Claude discovers tools via `tools/list` — all names start with `covenant_`.

---

## Cursor

1. Add to `.cursor/mcp.json` (see [cursor.mcp.json](../../packages/mcp/config/cursor.mcp.json)).
2. Reload window.
3. In Agent mode, ask:

> Preflight a 0.01 PHRS transfer from agent 0x... to 0x... using covenant_preflight.

Cursor's agent reads tool descriptions to choose `covenant_preflight` over generic web search.

---

## OpenAI Agents SDK

See [openai-agents.example.ts](../../packages/mcp/config/openai-agents.example.ts):

```typescript
import { Agent, MCPServerStdio } from "@openai/agents";

const covenant = new MCPServerStdio({
  name: "covenant",
  command: "npx",
  args: ["-y", "@covenant/mcp"],
  env: { /* PHAROS_RPC_URL, GOPLUS_*, DEPLOYER_PRIVATE_KEY */ },
});

await covenant.connect();

const agent = new Agent({
  name: "TreasuryBot",
  instructions: "Always covenant_preflight before Pharos transfers.",
  mcpServers: [covenant],
});
```

---

## Generic MCP client

Any stdio MCP client:

```json
{
  "command": "npx",
  "args": ["-y", "@covenant/mcp"],
  "env": { "PHAROS_RPC_URL": "...", "GOPLUS_APP_KEY": "...", "GOPLUS_APP_SECRET": "...", "DEPLOYER_PRIVATE_KEY": "0x..." }
}
```

Protocol: MCP 2024-11-05 / SDK 1.x — `initialize` → `tools/list` → `tools/call`.

---

## Authentication model

| Secret | Where | Used by |
|---|---|---|
| `DEPLOYER_PRIVATE_KEY` | MCP `env` block | Attestation signing, oracle writes |
| `ownerPrivateKey` in tool args | Per-call (avoid if possible) | Identity/covenant owner txs |
| GoPlus keys | MCP `env` | Risk reads |

**Best practice:** Pass keys via MCP server `env`, not in chat. Never log private keys.

---

## Discovery

Agents discover COVENANT via:

1. MCP `tools/list` — 10 tools, rich descriptions
2. Server `instructions` — payment workflow on initialize (supported clients)
3. [AGENTS.md](../../AGENTS.md) — repo root skill manifest
4. [SKILL.md](../../packages/mcp/SKILL.md) — package skill card
