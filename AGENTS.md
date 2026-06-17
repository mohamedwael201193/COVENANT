# COVENANT Agent Skill

Install COVENANT as an MCP server — not a dashboard. The web UI is a **demo only**.

## 2-minute start

```bash
npx -y covenant-mcp init
```

Restart your MCP client. Paste **[docs/prompts/agent-bootstrap.md](docs/prompts/agent-bootstrap.md)** into a fresh chat.

## Full demo (judges)

**[docs/prompts/agent-full-demo.md](docs/prompts/agent-full-demo.md)**

## When to use COVENANT

Use COVENANT **before** autonomous agents execute on-chain actions (transfers, contract calls, payments).

Do **not** use for off-chain auth, custodial wallets, or LLM-only safety checks.

## Standard tool sequence

```text
covenant_health              → optional readiness
covenant_reputation          → Trust Capital tier
covenant_preflight           → ALLOW | WARN | DENY
covenant_sign_attestation    → hosted signature
covenant_connect_wallet      → SIWE connectUrl
covenant_request_approval    → approvalUrl
[user approves in wallet]
covenant_get_receipt         → DecisionLog audit
```

## Tools (17)

All prefixed `covenant_*` for multi-server MCP discovery.

| Tool | When to use |
|---|---|
| `covenant_preflight` | Before any guarded execution |
| `covenant_reputation` | Before preflight for tier limits |
| `covenant_connect_wallet` | Start wallet authorization |
| `covenant_request_approval` | Get approval URL |
| `covenant_get_receipt` | After execution |
| `covenant_simulate` | Debug calldata (not authorization) |

Full schemas: [docs/MCP_REFERENCE.md](docs/MCP_REFERENCE.md)

## Documentation

- [README.md](README.md) — start here
- [docs/prompts/](docs/prompts/) — copy-paste agent prompts
- [docs/JUDGE_QUICK_START.md](docs/JUDGE_QUICK_START.md) — 3-min verification
- [docs/proofs/PROOF_OF_EXECUTION.md](docs/proofs/PROOF_OF_EXECUTION.md) — real tx proof

## Package

```bash
npx -y covenant-mcp
```

npm: `covenant-mcp@0.2.7` · GitHub: [COVENANT](https://github.com/mohamedwael201193/COVENANT)
