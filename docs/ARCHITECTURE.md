# COVENANT Architecture

Production credible-commitment layer for autonomous agents on **Pharos Atlantic Testnet** (chainId `688689`).

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Agent / Operator / Judge                          │
└───────────────┬───────────────────────────────┬─────────────────────────────┘
                │ MCP (stdio)                   │ REST / SSE
                ▼                               ▼
┌───────────────────────────┐       ┌──────────────────────────────────────────┐
│   packages/skill :8787    │       │         packages/web (React + Vite)      │
│   MCP tools + REST API    │◄──────│         Dashboard (TanStack Query)       │
└───────────┬───────────────┘       └──────────────────────────────────────────┘
            │
            │ deterministic engine + EIP-712 signing
            ▼
┌───────────────────────────┐       ┌───────────────────────────┐
│   Pharos Atlantic RPC     │       │   packages/indexer :8788  │
│   (viem publicClient)     │◄──────│   BullMQ + Postgres       │
└───────────┬───────────────┘       └───────────┬───────────────┘
            │                                     │
            │ on-chain reads/writes                 │ event watcher + projectors
            ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  IdentityRegistry → CovenantRegistry → GuardedExecutor → DecisionLog        │
│                                    ↓                                        │
│                          ReputationRegistry (Trust Capital)                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

## End-to-End Data Flow

```
IDENTITY → COVENANT → CERTIFICATION → GUARDED EXECUTION → DecisionLog → Trust Capital
```

| Stage | What happens | Where |
|---|---|---|
| **Identity** | Agent key registered with metadata URI | `IdentityRegistry` + `registerIdentity` tool |
| **Covenant** | Policy JSON hashed; hash + IPFS URI stored on-chain | `CovenantRegistry` + `setCovenant` tool |
| **Certification** | Rules + `eth_call` simulation + GoPlus risk → verdict | `packages/skill/src/engine/` |
| **Attestation** | On ALLOW only: attester signs EIP-712 `AllowAttestation` | `GuardedExecutor` verifying contract |
| **Execution** | Agent calls `GuardedExecutor.execute`; reverts `CovenantBreach()` without fresh ALLOW | On-chain |
| **Receipt** | Decision written to `DecisionLog` | On-chain + indexer projection |
| **Trust Capital** | Indexer oracle proposes score deltas from decisions | `ReputationRegistry` via `attestOutcome` |

## Monorepo Packages

| Package | Path | Role |
|---|---|---|
| `@covenant/contracts` | `packages/contracts` | Foundry Solidity: IdentityRegistry, CovenantRegistry, GuardedExecutor, DecisionLog, ReputationRegistry |
| `@covenant/shared` | `packages/shared` | ABIs, chain config, EIP-712 helpers, shared TypeScript types |
| `@covenant/skill` | `packages/skill` | MCP skill server + REST API on port **8787** |
| `@covenant/indexer` | `packages/indexer` | Event watcher, BullMQ workers, Prisma/Postgres projections, REST on **8788** |
| `@covenant/web` | `packages/web` | React + Vite dashboard (shadcn/ui, TanStack Query) |
| `@covenant/security/certik` | `packages/security/certik` | CertiK Skill Scanner adapter (`WAITING_FOR_OFFICIAL_ACCESS`) |

## Skill Server Layers

```
tools/ (MCP dispatch)
  └── engine/
        ├── rules.ts          — deterministic covenant policy
        ├── simulator.ts      — eth_call + eth_estimateGas
        ├── riskRead.goplus.ts — GoPlus counterparty reads
        ├── explainer.llm.ts  — narrative only (never authorizes)
        └── preflight.ts      — orchestrates verdict + ALLOW signing
  └── chain/
        ├── clients.ts        — viem contract clients
        ├── signer.ts         — EIP-712 AllowAttestation signing
        └── indexer.ts        — direct on-chain list reads (no DB)
  └── http/
        ├── rest.ts           — REST API
        ├── health.ts         — /health probes
        └── sse.ts            — decision event stream
  └── egress.ts               — outbound network allowlist
```

## Deterministic Safety Core

The **authorization verdict is 100% deterministic**. The LLM explains outcomes but **cannot produce ALLOW**.

### Verdict pipeline (`runPreflight`)

1. **Shape validation** — intent fields must be well-formed.
2. **Rule engine** (`evaluateRules`) — allowlist, denylist, value caps (tier-scaled), time windows, agent/covenant match, counterparty tier.
3. **Simulation** — if `requiredChecks` includes `"simulation"`, `eth_call` must succeed or verdict → DENY.
4. **GoPlus** — if `requiredChecks` includes `"goplus"`, malicious → DENY, warn → WARN (never upgrades to ALLOW).
5. **LLM explainer** — summary + anomaly flag; can only suggest DENY or WARN; strips any ALLOW from output.
6. **ALLOW attestation** — signed **only** when final verdict is `Verdict.ALLOW`.

```typescript
// packages/skill/src/engine/preflight.ts — ALLOW signing gate
if (verdict === Verdict.ALLOW) {
  result.attestation = await signAllowAttestation(services.clients, attestation);
}
```

### On-chain enforcement

`GuardedExecutor.execute(intent, attestation)` verifies:

- Fresh EIP-712 signature from the configured attester
- `intentHash` matches `keccak256(agent, target, keccak256(data), value, nonce)`
- `covenantHash` matches agent's on-chain covenant
- Deadline not expired

Mismatch → revert `CovenantBreach()`.

## Indexer Architecture

```
watcher.ts (poll Pharos logs from INDEXER_START_BLOCK)
    └── BullMQ queues
          ├── ingest  → projectors (agent, covenant, decision, breach, reputation)
          ├── score   → oracle.ts (deterministic TC deltas)
          └── cache   → Redis reputation cache warm
    └── Prisma/Postgres (agents, covenants, decisions, reputation, obligations)
    └── REST :8788 (read-optimized API for dashboard/index queries)
```

The skill server reads **directly from chain** for its REST endpoints. The indexer provides **cached/projections** for richer queries (pagination, filters, reputation sources).

## External Dependencies

| Service | Used by | Purpose |
|---|---|---|
| Pharos RPC | skill, indexer | Chain reads, writes, simulation |
| GoPlus API | skill | Counterparty/contract risk signals |
| LLM providers (Cerebras, SambaNova, Together, OpenRouter, Groq, Gemini) | skill | Explanations only |
| Pinata | optional | IPFS covenant storage |
| Supabase Postgres | indexer | Projections |
| Upstash Redis | indexer | BullMQ + reputation cache |

## Deployed Contracts

See [DEPLOYMENT.md](./DEPLOYMENT.md#contract-addresses-pharos-atlantic) for addresses and explorer links.

## Related Docs

- [API Reference](./API_REFERENCE.md)
- [MCP Reference](./MCP_REFERENCE.md)
- [Security](./SECURITY.md)
- [Deployment](./DEPLOYMENT.md)
- [Operations](./OPERATIONS.md)
