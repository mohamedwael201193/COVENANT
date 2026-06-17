# Agent Health Check Prompt

Quick MCP smoke test (~10 seconds).

```text
Verify COVENANT MCP is working.

1. Call covenant_health.
2. List all covenant_* tools (expect 17).
3. Report: status, chainId, attester address, tool count.

Do not ask for API keys, private keys, or wallet addresses.
If health fails, suggest: npx -y covenant-mcp init and restart MCP client.

For full validation after install, use docs/prompts/agent-bootstrap.md.
```
