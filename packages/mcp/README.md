# @covenant/mcp

**Stripe for Agent Trust** — MCP server for credible-commitment preflight on [Pharos Atlantic](https://pharosnetwork.xyz) (chainId `688689`).

Any AI agent installs COVENANT in under 5 minutes and gets 10 tools for identity, policy, preflight, reputation, and receipts.

## 5-minute install

```bash
# 1. One-command setup (writes .env.covenant + Cursor example)
npx @covenant/mcp init

# 2. Fill secrets in .env.covenant (RPC, GoPlus, attester key)

# 3. Add to your MCP client — Cursor example:
#    Copy packages/mcp/config/cursor.mcp.json → .cursor/mcp.json

# 4. Verify
npx @covenant/mcp   # should stay running on stdio (Ctrl+C to exit)
```

### Required environment

| Variable | Purpose |
|---|---|
| `PHAROS_RPC_URL` | Pharos Atlantic JSON-RPC |
| `GOPLUS_APP_KEY` / `GOPLUS_APP_SECRET` | Counterparty risk reads |
| `DEPLOYER_PRIVATE_KEY` | Attester/oracle signer (GuardedExecutor attester) |

Optional: `PREFLIGHT_LLM_ENABLED=false` (recommended for latency), `COVENANT_OWNER_PRIVATE_KEY` for owner-only writes.

## MCP client configs

| Client | Example file |
|---|---|
| Cursor | [config/cursor.mcp.json](./config/cursor.mcp.json) |
| Claude Desktop | [config/claude-desktop.mcp.json](./config/claude-desktop.mcp.json) |
| Claude Code | [config/claude-code.mcp.json](./config/claude-code.mcp.json) |
| OpenAI Agents SDK | [config/openai-agents.example.ts](./config/openai-agents.example.ts) |
| Generic stdio | [config/generic.mcp.json](./config/generic.mcp.json) |

## Tools (10)

| Tool | Read-only | Purpose |
|---|---|---|
| `covenant_health` | ✓ | RPC + attester connectivity |
| `covenant_reputation` | ✓ | Trust Capital score/tier |
| `covenant_preflight` | | Deterministic ALLOW/WARN/DENY + attestation |
| `covenant_simulate` | ✓ | eth_call / estimateGas debug |
| `covenant_verify_counterparty` | ✓ | GoPlus risk signal |
| `covenant_get_receipt` | ✓ | DecisionLog audit receipt |
| `covenant_register_identity` | | Onboard agent key |
| `covenant_set_covenant` | | Publish policy hash |
| `covenant_rotate_key` | | Rotate compromised agent key |
| `covenant_attest_outcome` | | Oracle reputation update |

Legacy aliases (`preflight`, `reputation`, …) still resolve for backward compatibility.

## Agent workflow: send money

```
User: "Pay 0.01 PHRS to 0xRecipient"
  → covenant_reputation { agent }
  → covenant_preflight { intent, covenant, covenantHash }
  → (client submits GuardedExecutor.execute with attestation)
  → covenant_get_receipt { decisionId }
```

See [docs/skill/EXAMPLES.md](../../docs/skill/EXAMPLES.md) for full flows and integration snippets.

## Monorepo dev

```bash
pnpm install
pnpm --filter @covenant/skill build
pnpm --filter @covenant/mcp build
node packages/mcp/dist/cli.js
```

## License

MIT
