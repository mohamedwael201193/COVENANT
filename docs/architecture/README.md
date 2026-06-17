# Architecture

COVENANT is a trust and authorization rail between AI agents and on-chain execution on Pharos Atlantic.

## Flow

```text
MCP Client (Cursor / Claude / Agents SDK)
  ↓ stdio or https://covenant-skill.onrender.com/mcp
COVENANT Skill API (Render)
  ↓ Postgres sessions + approvals
  ↓ Pharos RPC (atlantic.dplabs-internal.com)
Smart Contracts
  ├── IdentityRegistry    — owner ↔ agent mapping
  ├── CovenantRegistry    — policy hashes
  ├── GuardedExecutor     — attestation-gated execution
  ├── DecisionLog         — immutable receipts
  └── ReputationRegistry  — Trust Capital scores
  ↓
Web Approval UI (Vercel) — wallet connect + execute
```

## Packages

| Package | Role |
|---|---|
| `covenant-mcp` | npm MCP server entry (`npx covenant-mcp`) |
| `covenant-skill` | Preflight engine, sessions, hosted MCP |
| `covenant-shared` | Chain config, EIP-712, ABIs |
| `packages/web` | Approval UI (demo) |
| `packages/contracts` | Solidity on Pharos Atlantic |

## Deterministic safety

- **Preflight** = rules + simulation (+ optional GoPlus). LLM explains only.
- **Attestation** = EIP-712 signed ALLOW from attester oracle.
- **Execution** = `GuardedExecutor.execute` verifies attestation on-chain.
- **Receipt** = `DecisionLog` event → `covenant_get_receipt`.

## Deep dive

Full architecture: [../ARCHITECTURE.md](../ARCHITECTURE.md)

Security model: [../SECURITY.md](../SECURITY.md)

MCP tool schemas: [../MCP_REFERENCE.md](../MCP_REFERENCE.md)
