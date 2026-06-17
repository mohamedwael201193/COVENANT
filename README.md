# COVENANT

**Stripe for Agent Trust** — reusable MCP skill for autonomous agents on **Pharos Atlantic** (chainId `688689`).

Install in under 5 minutes. Any agent gets deterministic preflight, signed attestations, on-chain receipts, and Trust Capital reputation.

```bash
npx @covenant/mcp init
```

| Product | Role |
|---|---|
| **`@covenant/mcp`** | Primary — MCP server for agents |
| **REST skill API** | Production host / scripts |
| **Web dashboard** | Demo UI only — [covenant-web](https://covenant-web-mu.vercel.app) |

## Agent documentation

| Doc | Description |
|---|---|
| [AGENTS.md](AGENTS.md) | Skill manifest for AI agents |
| [5-minute install](docs/skill/INSTALL.md) | Fast setup |
| [Examples](docs/skill/EXAMPLES.md) | Send-money flow, onboarding |
| [Integrations](docs/skill/INTEGRATIONS.md) | Claude, Cursor, OpenAI Agents |
| [MCP package](packages/mcp/README.md) | `@covenant/mcp` reference |
| [Comparison](docs/skill/COMPARISON.md) | vs GitHub, Stripe, Supabase MCP |
| [Scorecard](docs/skill/SCORECARD.md) | Skill quality metrics |

## MCP tools (10)

`covenant_health` · `covenant_reputation` · `covenant_preflight` · `covenant_simulate` · `covenant_verify_counterparty` · `covenant_get_receipt` · `covenant_register_identity` · `covenant_set_covenant` · `covenant_rotate_key` · `covenant_attest_outcome`

Legacy names (`preflight`, `reputation`, …) still work.

## Cursor config

```json
{
  "mcpServers": {
    "covenant": {
      "command": "npx",
      "args": ["-y", "@covenant/mcp"],
      "env": {
        "PHAROS_RPC_URL": "https://atlantic-rpc.pharosnetwork.xyz",
        "GOPLUS_APP_KEY": "...",
        "GOPLUS_APP_SECRET": "...",
        "DEPLOYER_PRIVATE_KEY": "0x...",
        "PREFLIGHT_LLM_ENABLED": "false"
      }
    }
  }
}
```

## Technical docs

| Doc | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System design |
| [MCP Reference](docs/MCP_REFERENCE.md) | Tool schemas |
| [API Reference](docs/API_REFERENCE.md) | REST endpoints |
| [Deployment](docs/DEPLOYMENT.md) | Render / production |
| [Security](docs/SECURITY.md) | Non-custodial, LLM cannot ALLOW |

## Monorepo

```bash
pnpm install && pnpm generate:abis && pnpm test && pnpm build
pnpm --filter @covenant/mcp build
node packages/mcp/dist/cli.js   # MCP stdio
pnpm dev:skill                  # MCP + REST :8787
pnpm dev:web                    # Demo dashboard :5173
```

Live skill API: https://covenant-skill.onrender.com

## Status

| Component | Status |
|---|---|
| `@covenant/mcp` NPM package | ✅ publish-ready |
| MCP tool descriptions | ✅ agent-optimized |
| Smart contracts (Pharos) | ✅ deployed + verified |
| Tests (Foundry + Vitest) | ✅ |
| Demo dashboard | ✅ optional |
