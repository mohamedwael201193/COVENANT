# COVENANT NPM Release Report

**Date:** 2026-06-17  
**Status:** PUBLICLY INSTALLABLE

## Published packages

| Package | Version | Registry | Install |
|---|---|---|---|
| `covenant-shared` | 0.1.1 | https://registry.npmjs.org | `npm install covenant-shared` |
| `covenant-skill` | 0.1.1 | https://registry.npmjs.org | `npm install covenant-skill` |
| `covenant-mcp` | 0.1.1 | https://registry.npmjs.org | `npx -y covenant-mcp` |

## Why not `@covenant/mcp`?

`npx @covenant/mcp` returned **404** because:

1. Packages were **never published** to npm.
2. The **`@covenant` npm organization exists** but account `mohamed-wael` **does not have publish access** (`403 Forbidden` on org).

**Fix shipped:** Unscoped public packages `covenant-mcp`, `covenant-skill`, `covenant-shared`.

**Antigravity / any agent config:**

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

## Clean-machine proof (2026-06-17)

```text
> npx -y covenant-mcp@0.1.1 init
Created .env.covenant
Wrote .cursor/mcp.json.example

> npm install covenant-mcp@0.1.1
added 153 packages

> MCP SDK test (tools/list + covenant_health)
PASS: tools/list 10 tools
PASS: covenant_health
status: ok, chainId: 688689
```

## Publish commands

```bash
export NPM_TOKEN=***   # npm access token with publish scope
pnpm install
node scripts/publish-npm.mjs
```

Order: `covenant-shared` → `covenant-skill` → `covenant-mcp`

## Scorecard

| Check | Result |
|---|---|
| PUBLIC INSTALLABLE | **YES** (`npx covenant-mcp`) |
| NPM READY | **YES** |
| CURSOR READY | **YES** (use `covenant-mcp` in mcp.json) |
| CLAUDE READY | **YES** |
| ANTIGRAVITY READY | **YES** (change `@covenant/mcp` → `covenant-mcp`) |
| OPENAI AGENTS READY | **YES** |
| MCP COMPLIANT | **YES** (10 tools, SDK stdio verified) |

## Remaining blockers

| Blocker | Action |
|---|---|
| `@covenant/mcp` name | Create/join `@covenant` npm org OR republish as `@mohamed-wael/covenant-mcp` |
| npm token in chat | **Rotate token** at npmjs.com — it was exposed in conversation |

## Future: reclaim `@covenant` scope

1. https://www.npmjs.com/org/create or request access to existing `@covenant` org
2. Republish with `"name": "@covenant/mcp"` and deprecate `covenant-mcp` with message pointing to scoped package
