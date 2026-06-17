# COVENANT Security

Security model for the COVENANT skill server, contracts, and operational deployment.

## Core Principles

1. **Non-custodial** — The server never holds user private keys. Tool calls that mutate chain state require the caller to supply `ownerPrivateKey` for identity/covenant operations. The deployer key signs **ALLOW attestations only**, not user fund transfers.
2. **Deterministic authorization** — Verdicts (ALLOW / WARN / DENY) are computed by rules + simulation + GoPlus. The LLM provides explanations only.
3. **On-chain enforcement** — Even with a stolen attester key, execution still requires matching intent hash, covenant hash, and deadline on `GuardedExecutor`.
4. **Declared egress** — All outbound HTTP is blocked unless the host is on an explicit allowlist.
5. **Input validation** — Every MCP tool argument and REST body is validated with Zod schemas.

## Non-Custodial Model

| Actor | Key | Can do |
|---|---|---|
| Agent owner | `ownerPrivateKey` (client-supplied) | Register identity, set covenant, rotate key |
| Attester oracle | `DEPLOYER_PRIVATE_KEY` (server env) | Sign EIP-712 ALLOW attestations; write reputation via `attestOutcome` |
| Agent | Agent wallet | Call `GuardedExecutor.execute` with valid attestation |

The skill server **does not**:

- Store or log private keys beyond transient request handling
- Transfer PHRS or tokens on behalf of users
- Bypass covenant checks

The attester wallet must be funded with PHRS for gas when signing is needed; it does not custody user assets.

## LLM Cannot ALLOW

The LLM explainer (`packages/skill/src/engine/explainer.llm.ts`) is architecturally barred from authorizing fund movement:

- System prompt: *"You MUST NOT authorize fund movement. Never output ALLOW as a verdict."*
- `llmExplanationSchema` rejects `suggestedVerdict: ALLOW` at the Zod layer
- Runtime sanitization strips ALLOW if a model emits it anyway
- Preflight only signs attestation when deterministic verdict is `Verdict.ALLOW`
- Tests in `packages/skill/test/explainer.test.ts` enforce this invariant

```typescript
// LLM can only downgrade, never upgrade to ALLOW
suggestedVerdict?: Verdict.DENY | Verdict.WARN  // packages/shared/src/types.ts
```

Even if the LLM suggests DENY/WARN, the deterministic pipeline has already computed the verdict; LLM input can only further restrict (WARN/DENY), not grant ALLOW.

## Egress Allowlist

All outbound `fetch` from the skill server goes through `fetchWithEgress` (`packages/skill/src/egress.ts`).

### Default allowed hosts

| Host | Purpose |
|---|---|
| `api.zan.top` | Pharos RPC (default) |
| `atlantic.dplabs-internal.com` | Pharos RPC fallback |
| `api.gopluslabs.io` | GoPlus risk API |
| `api.cerebras.ai` | LLM |
| `api.sambanova.ai` | LLM |
| `api.together.xyz` | LLM |
| `openrouter.ai` | LLM |
| `api.groq.com` | LLM |
| `generativelanguage.googleapis.com` | Gemini LLM |
| `api.pinata.cloud` | IPFS |
| `atlantic.pharosscan.xyz` | Explorer API |

Requests to any other host throw `EgressViolationError`. Tests in `packages/skill/test/egress.test.ts` verify enforcement.

**Note:** The indexer and CertiK adapter use separate fetch paths. CertiK scanner URL is not on the skill egress list until explicitly configured.

## Threat Model Summary

| Threat | Mitigation | Residual risk |
|---|---|---|
| **Malicious LLM output** | LLM excluded from ALLOW path; schema + sanitization | Low — covered by tests |
| **Compromised attester key** | Attestations still bound to intent/covenant hash + deadline; rotate attester on-chain | Medium — attacker could sign ALLOW for valid intents until rotated |
| **Covenant bypass** | `GuardedExecutor` reverts `CovenantBreach()` on mismatch | Low — on-chain enforced |
| **Fake counterparty** | GoPlus address + token checks; malicious → DENY | Medium on Pharos — GoPlus has limited Pharos chain coverage (returns `unknown`) |
| **RPC manipulation** | Simulation via public RPC; capability probe at boot | Medium — shallow simulation without `debug_traceCall` |
| **Egress exfiltration** | Host allowlist on skill server | Low |
| **Oversized inputs** | JSON body limit 256kb (skill), 128kb (indexer); Zod max lengths | Low |
| **Secret leakage** | Secrets in env only; `.env` gitignored | Operator responsibility |
| **Reentrancy / delegatecall** | Contracts: CEI pattern, no delegatecall, no tx.origin | Low — Foundry tested |
| **Sybil reputation** | Scores cite DecisionLog IDs; on-chain provenance | Cold-start — empty registry initially |

## Contract Security

- **Foundry tests:** 32 contract tests including fuzz and invariants
- **Access control:** Owner-only writes on registries; attester-only on GuardedExecutor verification path
- **Invariant:** No `execute` without fresh matching ALLOW attestation
- **Explorer verification:** Pending `PHAROS_EXPLORER_API_KEY` for automated verify

## CertiK Skill Scanner

| Status | Detail |
|---|---|
| `WAITING_FOR_OFFICIAL_ACCESS` | Adapter at `packages/security/certik/` configured; scanner URL/API key not yet available |

When access is granted, set:

```
CERTIK_SCANNER_URL=
CERTIK_SCANNER_API_KEY=
CERTIK_SCANNER_ENABLED=true
```

Run: `pnpm --filter @covenant/security-certik scan` (or via CI).

## Simulation Limitations

Pharos public RPC may not expose `debug_traceCall`. COVENANT uses:

- `eth_call` — detect reverts
- `eth_estimateGas` — gas estimation

This catches obvious revert paths but **not** deep multi-hop exploit chains. Document honestly in submissions; do not claim full transaction tracing.

## Security Checklist

- [ ] `DEPLOYER_PRIVATE_KEY` matches on-chain `GuardedExecutor.attester`
- [ ] Attester wallet funded; `/health` returns `status: ok`
- [ ] GoPlus credentials valid
- [ ] At least one LLM key configured (explanations)
- [ ] No secrets in git
- [ ] Egress tests pass: `pnpm --filter covenant-skill test`
- [ ] LLM ALLOW rejection tests pass
- [ ] CertiK scan when access available

## Related Docs

- [Architecture — Deterministic Safety Core](./ARCHITECTURE.md#deterministic-safety-core)
- [Operations](./OPERATIONS.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
