# COVENANT Agent Skill

COVENANT is an MCP server for trust, authorization, and guarded on-chain execution on Pharos.

**Install:** `npx -y covenant-mcp init` → restart MCP client.

## When to use

Call COVENANT **before** any on-chain action (transfer, contract call, payment).

Do **not** use for off-chain auth, custodial wallets, or LLM-only safety checks.

## Standard sequence

```text
covenant_health → covenant_reputation → covenant_preflight
→ covenant_sign_attestation → covenant_connect_wallet → covenant_request_approval
→ [user approves] → covenant_get_receipt
```

## Agent prompts

| Task | Prompt |
|---|---|
| Install | [docs/prompts/agent-install.md](docs/prompts/agent-install.md) |
| Validate | [docs/prompts/agent-bootstrap.md](docs/prompts/agent-bootstrap.md) |
| Health check | [docs/prompts/agent-health-check.md](docs/prompts/agent-health-check.md) |
| Reputation | [docs/prompts/agent-reputation-review.md](docs/prompts/agent-reputation-review.md) |
| Risk review | [docs/prompts/agent-risk-review.md](docs/prompts/agent-risk-review.md) |
| Connect wallet | [docs/prompts/agent-wallet-authorization.md](docs/prompts/agent-wallet-authorization.md) |
| Request approval | [docs/prompts/agent-request-approval.md](docs/prompts/agent-request-approval.md) |
| End-to-end | [docs/prompts/agent-end-to-end.md](docs/prompts/agent-end-to-end.md) |

## Tools

17 tools prefixed `covenant_*`. Schemas: [docs/MCP_REFERENCE.md](docs/MCP_REFERENCE.md)

## Documentation

- [README.md](README.md) — product docs
- [docs/README.md](docs/README.md) — doc index
- [docs/skill/EXAMPLES.md](docs/skill/EXAMPLES.md) — workflows

```bash
npx -y covenant-mcp
```

npm: `covenant-mcp@0.2.7`
