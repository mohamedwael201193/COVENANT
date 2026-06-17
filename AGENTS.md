# COVENANT Agent Skill

**Reusable Pharos Skill** — trust and authorization layer for AI agents on Pharos Atlantic.

Install: `npx -y covenant-mcp init` → restart MCP client.

## When to use

Call COVENANT **before** any Pharos Agent executes on-chain actions. COVENANT secures other Skills — it does not replace them.

## Sequence

```text
covenant_reputation → covenant_preflight → covenant_sign_attestation
→ covenant_connect_wallet → covenant_request_approval → covenant_get_receipt
```

## Prompts

| Task | File |
|---|---|
| Install | [docs/prompts/agent-install.md](docs/prompts/agent-install.md) |
| Validate | [docs/prompts/agent-bootstrap.md](docs/prompts/agent-bootstrap.md) |
| End-to-end | [docs/prompts/agent-end-to-end.md](docs/prompts/agent-end-to-end.md) |

17 tools · [docs/MCP_REFERENCE.md](docs/MCP_REFERENCE.md) · [README.md](README.md)
