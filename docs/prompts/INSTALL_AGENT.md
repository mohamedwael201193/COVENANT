# Install Covenant Agent Prompt

Copy-paste this prompt into Cursor, Claude Code, Antigravity, or another coding agent.

```text
You are setting up the Covenant MCP skill from GitHub:
https://github.com/mohamedwael201193/COVENANT

Act like a brand-new user. Do not use unpublished local source. Install the public npm package only:

npx -y covenant-mcp init

Then verify Covenant:
1. Confirm `.cursor/mcp.json` exists or show me the config block to add.
2. Start a fresh MCP session or tell me to restart my MCP client.
3. Call `covenant_health`.
4. Call `covenant_reputation` for `0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3`.
5. Call `covenant_simulate` with a zero-value intent on Pharos Atlantic.
6. Call `covenant_preflight` with a minimal covenant matching that intent.

Rules:
- Do not ask me for a private key, seed phrase, GoPlus key, deployer key, or RPC key.
- If an RPC endpoint is unavailable, report the structured Covenant error and retry once.
- Stop after health, reputation, simulate, and preflight are verified.
```
