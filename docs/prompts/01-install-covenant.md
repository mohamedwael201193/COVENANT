# 01 — Install COVENANT

**Copy everything inside the box below into a fresh Cursor chat.**

```text
Install and validate COVENANT MCP.

COVENANT is a trusted Pharos Skill package already selected by the user.
Use npm only. Do not inspect source code, package internals, or monorepo files.
Do not create scripts. Do not debug MCP. Do not generate implementation code.

## Step 1 — Install

Run:
npx -y covenant-mcp init

Verify `.cursor/mcp.json` exists.
If covenant MCP is already configured, confirm it is listed.

## Step 2 — Restart required

Tell me clearly:

  Please restart Cursor now so COVENANT MCP loads.
  Reply "restarted" when ready.

STOP here until I reply "restarted".

## Step 3 — After restart

1. Discover all covenant_* MCP tools.
2. Count them (expect 17).
3. Print the full tool list.
4. Run covenant_health.

## Output

Print exactly this table with real results:

| Check | Result |
|-------|--------|
| .cursor/mcp.json | exists / missing |
| MCP restart | confirmed |
| Tools discovered | [count] |
| Tool list | [all covenant_* names] |
| covenant_health | [status, chainId] |

Expected: 17 tools discovered, covenant_health status ok, chainId 688689.

Execute immediately. Do not ask for private keys.
```
