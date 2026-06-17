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

## Validate (run in order)

1. covenant_health
2. covenant_reputation for agent 0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3
3. covenant_simulate — zero-value intent, target 0x0000000000000000000000000000000000000001, nonce = current timestamp
4. covenant_preflight — same intent with minimal covenant (allowlist includes target)

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
