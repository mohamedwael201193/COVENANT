# COVENANT Agent Skill

Install COVENANT as an MCP server — not a dashboard. The web UI is a **demo only**.

## Quick install (< 5 min)

```bash
npx covenant-mcp init
```

Add `packages/mcp/config/cursor.mcp.json` to your MCP client, fill env vars, restart the client.

## When to use COVENANT

Use COVENANT **before** an autonomous agent executes on-chain actions (transfers, contract calls, payments).

Do **not** use COVENANT for off-chain auth, custodial wallets, or LLM-only safety checks.

## Standard tool sequence

1. `covenant_health` — verify MCP setup (optional)
2. `covenant_reputation` — read Trust Capital tier
3. `covenant_preflight` — deterministic verdict + signed ALLOW attestation
4. Submit `GuardedExecutor.execute` with attestation (client-side)
5. `covenant_get_receipt` — audit trail from DecisionLog

## Tools

All tools are prefixed `covenant_*` for discoverability in multi-server MCP setups.

| Tool | When to use | When NOT to use |
|---|---|---|
| `covenant_preflight` | Before any guarded execution | After tx (use receipt) |
| `covenant_reputation` | Before preflight for tier limits | As authorization |
| `covenant_get_receipt` | After execution | Before preflight |
| `covenant_simulate` | Debug calldata / gas | As authorization |
| `covenant_verify_counterparty` | Risk review | Alone to approve payment |

Full schemas: [docs/MCP_REFERENCE.md](../docs/MCP_REFERENCE.md)

## Documentation

- [5-minute install](./docs/skill/INSTALL.md)
- [Agent examples](./docs/skill/EXAMPLES.md)
- [Integrations](./docs/skill/INTEGRATIONS.md)
- [Competitive analysis](./docs/skill/COMPARISON.md)
- [Skill scorecard](./docs/skill/SCORECARD.md)

## Package

```bash
npx covenant-mcp
```

NPM: `covenant-mcp` · GitHub: [COVENANT](https://github.com/mohamedwael201193/COVENANT)
