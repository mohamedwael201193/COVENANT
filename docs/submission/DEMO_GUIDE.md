# Demo Guide

90-second demo script for COVENANT — optimized for hackathon video and live presentation.

## Demo Arc (recommended order)

```
Register agent → Set covenant → Preflight ALLOW → Execute on-chain → Show receipt → Breach revert
```

This demonstrates **binding policy**, **deterministic certification**, **on-chain enforcement**, and **slashable failure**.

## Before You Start

### Prerequisites

- Skill server running (`pnpm dev:skill` or Render deployment)
- Dashboard open: https://web-eight-eta-26.vercel.app
- PharosScan open: https://atlantic.pharosscan.xyz
- Attester funded; `/health` returns `ok`

### Key addresses (have these ready)

| Item | Value |
|---|---|
| IdentityRegistry | `0x05545F026b75f03aE9Cf1eA8a8373473c94ed323` |
| GuardedExecutor | `0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F` |
| Attester | `0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3` |

## Scene 1: "Agents need binding promises" (15s)

**Say:** "Autonomous agents can move funds — but who trusts their intent? COVENANT makes agent promises *binding* on Pharos."

**Show:** Architecture slide or [ARCHITECTURE.md](../ARCHITECTURE.md) diagram.

```
IDENTITY → COVENANT → CERTIFICATION → GUARDED EXECUTION → DecisionLog → Trust Capital
```

## Scene 2: Already deployed (15s)

**Say:** "Contracts are live on Pharos Atlantic testnet."

**Show:** Click through pre-recorded txs (fast):

| Step | Tx |
|---|---|
| Register agent | [0x53e91cf1…](https://atlantic.pharosscan.xyz/tx/0x53e91cf1a0dace92fc2bbf4601fa09912af522d8e7147e458a7ff62edf7f1756) |
| Set covenant | [0x86a7ed75…](https://atlantic.pharosscan.xyz/tx/0x86a7ed75957452f81dcf95f92fab8116aa7e7da2f36ed9317ca670275728857e) |

## Scene 3: Dashboard + decision feed (15s)

**Say:** "Our React dashboard reads from the skill REST API — agents, covenants, and a live decision feed."

**Show:**
1. Open dashboard
2. Agents tab — registered agent visible
3. Decisions tab — ALLOW entries
4. Health indicator green

## Scene 4: Preflight certification (20s)

**Say:** "Before any execution, preflight runs deterministic rules, eth_call simulation, and GoPlus risk. The LLM explains — it never authorizes."

**Show:** Run preflight via REST or MCP:

```bash
curl -s -X POST http://localhost:8787/api/preflight \
  -H "Content-Type: application/json" \
  -d '{
    "intent": { "agent": "0x...", "target": "0x...", "data": "0x", "value": "0", "nonce": "0" },
    "covenant": { "...": "matching covenant" },
    "covenantHash": "0x..."
  }' | jq '{ verdict, violations, attestation: .attestation != null }'
```

**Highlight:**
- `verdict: "ALLOW"`
- `attestation` object with EIP-712 signature (v, r, s)
- If GoPlus returns `unknown` on Pharos — explain gracefully, does not block ALLOW

## Scene 5: Guarded execution succeeds (15s)

**Say:** "Only a fresh signed ALLOW attestation unlocks execution."

**Show:** [ALLOW tx](https://atlantic.pharosscan.xyz/tx/0x1ff0fa3f3c0d3957b7e8ee21b9402b5f5051fc428cf3f822eda25c24feba0f8b)

Point to:
- `GuardedExecutor.execute` call
- DecisionLog event with receipt ID

## Scene 6: Breach revert — the money shot (15s)

**Say:** "Tamper the intent or covenant — the chain reverts. No attestation, no execution."

**Show:** Transaction that reverted `CovenantBreach()` on PharosScan.

**Say:** "This is on-chain enforcement, not an advisory check."

## Scene 7: Trust Capital (10s)

**Say:** "Every decision feeds Trust Capital — reputation that re-parameterizes the next covenant."

**Show:**
```bash
curl -s http://localhost:8787/api/reputation/0xAGENT | jq
```

Or dashboard reputation view.

## Scene 8: MCP composability (10s, optional)

**Say:** "Any agent integrates via three MCP calls: preflight, getReceipt, reputation."

**Show:** Cursor MCP tool list (9 tools) — [MCP_REFERENCE.md](../MCP_REFERENCE.md)

## Live Demo Script (CLI)

Full scripted demo:

```bash
pnpm --filter covenant-skill demo:live
# or: tsx packages/skill/scripts/demo-live.ts
```

Runs: register → covenant → ALLOW execute → breach attempt.

## Talking Points for Judges

| Topic | Line |
|---|---|
| **Pharos** | Native testnet deployment, RPC simulation, on-chain attestations |
| **GoPlus** | Counterparty risk in preflight pipeline |
| **Security** | LLM cannot ALLOW; egress allowlist; non-custodial |
| **CertiK** | Adapter ready; `WAITING_FOR_OFFICIAL_ACCESS` |
| **Innovation** | Trustworthiness as credence good — made binding |

## What NOT to claim

- Full transaction tracing (no `debug_traceCall` on public RPC)
- CertiK PASS badge (not yet available)
- GoPlus full Pharos token coverage (returns `unknown`)

## Troubleshooting During Live Demo

| Issue | Quick fix |
|---|---|
| `/health` degraded | Fund attester wallet |
| Dashboard empty | Check `VITE_API_URL` |
| Preflight DENY | Show violations array — still demonstrates deterministic core |
| RPC slow | Use pre-recorded PharosScan txs as backup |

See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md).

## Related Docs

- [JUDGE_TESTING_GUIDE.md](./JUDGE_TESTING_GUIDE.md)
- [API_REFERENCE.md](../API_REFERENCE.md)
- [README.md](../README.md)
