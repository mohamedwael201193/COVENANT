# Agent Bootstrap Prompt

Copy-paste into **Cursor**, **Claude Code**, **Antigravity**, or any MCP-capable agent.

```text
You are onboarding COVENANT.

Repository: https://github.com/mohamedwael201193/COVENANT
Package: covenant-mcp@0.2.7 (npm only — do not use unpublished local source unless developing)

## Install

Run:
npx -y covenant-mcp init

Confirm `.cursor/mcp.json` exists. If MCP is already configured, verify covenant-mcp is listed.
Tell me to restart the MCP client if tools are not visible.

## Discover tools

List all MCP tools from the covenant server. Expect 17 tools prefixed covenant_*.

## Inputs

Ask ONCE if not already provided:
- AGENT_ADDRESS — wallet or on-chain agent to evaluate (use <YOUR_AGENT_ADDRESS>)

If none provided, use this public probe (no personal wallet):
PROBE_AGENT = 0x05545F026b75f03aE9Cf1eA8a8373473c94ed323  # IdentityRegistry contract

PROBE_TARGET = 0x0000000000000000000000000000000000000001
NONCE = current Unix timestamp as string

## Validate (run in order)

1. covenant_health
2. covenant_reputation for AGENT_ADDRESS (or PROBE_AGENT)
3. covenant_simulate — intent: agent, target=PROBE_TARGET, data=0x, value=0, nonce=NONCE
4. covenant_preflight — same intent with minimal covenant:
   - version "1", agent and owner = agent address used above
   - allowlist: [PROBE_TARGET], denylist: []
   - baseMaxValueWei: "1000000000000000000"
   - tierLimits: [{ tier: 1, maxValueWei: "1000000000000000000" }]
   - minCounterpartyTier: 0, timeWindows: [], requiredChecks: ["simulation"]
   - createdAt: current ISO timestamp
   - covenantHash: 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

## Report

Print a table:
| Tool | Status | Latency | Notes |

Include: npm version, tool count, chainId from health, preflight verdict.

## Rules

- Do not ask for private keys, seed phrases, GoPlus keys, or deployer keys.
- Do not ask for permission — execute the full validation workflow.
- If RPC fails, report the error once and retry once.
- Stop after the four validation tools complete.
```
