# 5-Minute Install Guide

> **Quick path:** See [README § Installation](../README.md#installation) for `npx covenant-mcp init` and zero-secret setup. This guide covers optional secrets and advanced configuration.

Install COVENANT MCP for any agent client in five steps.

## Step 1 — Initialize (30 seconds)

```bash
npx covenant-mcp init
```

Creates `.env.covenant` and `.cursor/mcp.json.example`.

## Step 2 — Secrets (2 minutes)

Edit `.env.covenant`:

```env
PHAROS_RPC_URL=https://atlantic.dplabs-internal.com
GOPLUS_APP_KEY=your_key
GOPLUS_APP_SECRET=your_secret
DEPLOYER_PRIVATE_KEY=0x...   # GuardedExecutor attester
PREFLIGHT_LLM_ENABLED=false  # recommended
```

Get GoPlus keys: https://gopluslabs.io  
Pharos faucet: Pharos Atlantic testnet docs

## Step 3 — MCP config (1 minute)

**Cursor** — merge into `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "covenant": {
      "command": "npx",
      "args": ["-y", "covenant-mcp"],
      "env": {
        "PHAROS_RPC_URL": "https://atlantic.dplabs-internal.com",
        "GOPLUS_APP_KEY": "...",
        "GOPLUS_APP_SECRET": "...",
        "DEPLOYER_PRIVATE_KEY": "0x...",
        "PREFLIGHT_LLM_ENABLED": "false"
      }
    }
  }
}
```

Other clients: see [packages/mcp/config/](../../packages/mcp/config/).

## Step 4 — Restart client (30 seconds)

Restart Cursor / Claude Desktop / your agent runtime so MCP loads.

## Step 5 — Verify (1 minute)

Ask your agent:

> Call `covenant_health` and show the result.

Expected: JSON with `status: "ok"`, `chainId: 688689`, attester balance.

Then:

> Call `covenant_reputation` for agent `0x...`

## Troubleshooting

| Issue | Fix |
|---|---|
| Tool list empty | Restart MCP client; check `npx covenant-mcp` runs without env errors |
| `env invalid` | Set `PHAROS_RPC_URL` |
| `GOPLUS required` | Set both GoPlus keys |
| Preflight slow | Set `PREFLIGHT_LLM_ENABLED=false` |
| Attester mismatch | `DEPLOYER_PRIVATE_KEY` must match on-chain attester |

## Monorepo (developers)

```bash
pnpm install
pnpm --filter covenant-skill build
pnpm --filter covenant-mcp build
MCP_STDIO_ENABLED=true pnpm dev:skill
```
