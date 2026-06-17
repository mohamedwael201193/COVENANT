# COVENANT Agent Skill

Install COVENANT as an MCP server — not a dashboard. The web UI is a **demo only**.

## Judge path (< 60s, no wallet)

```bash
npx -y covenant-mcp init
```

Paste **[docs/prompts/judge-demo.md](docs/prompts/judge-demo.md)** into a fresh chat.

## Video demo (~90s, with wallet)

**[docs/prompts/video-demo.md](docs/prompts/video-demo.md)**

## Developer path

**[docs/prompts/agent-bootstrap.md](docs/prompts/agent-bootstrap.md)**

## When to use COVENANT

Use COVENANT **before** autonomous agents execute on-chain actions (transfers, contract calls, payments).

Do **not** use for off-chain auth, custodial wallets, or LLM-only safety checks.

## Standard tool sequence

```text
covenant_health → covenant_reputation → covenant_preflight → covenant_sign_attestation
→ covenant_connect_wallet → covenant_request_approval → [user approves] → covenant_get_receipt
```

## Tools (17)

All prefixed `covenant_*`. Schemas: [docs/MCP_REFERENCE.md](docs/MCP_REFERENCE.md)

## Documentation

- [README.md](README.md) — start here
- [docs/prompts/judge-demo.md](docs/prompts/judge-demo.md) — hackathon judges
- [docs/prompts/video-demo.md](docs/prompts/video-demo.md) — screen recording
- [docs/proofs/PROOF_OF_EXECUTION.md](docs/proofs/PROOF_OF_EXECUTION.md) — on-chain proof

```bash
npx -y covenant-mcp
```

npm: `covenant-mcp@0.2.7`
