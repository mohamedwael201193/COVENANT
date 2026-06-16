# Judge Testing Guide

Quick evaluation guide for hackathon judges — verify COVENANT works in ~15 minutes.

## What You're Evaluating

COVENANT is a **credible-commitment layer** for autonomous agents:

1. Agents register identity and bind covenant policies on-chain
2. Preflight certifies intents (rules + simulation + GoPlus) — LLM explains only
3. `GuardedExecutor` enforces ALLOW attestations before execution
4. `DecisionLog` records receipts; Trust Capital accrues in `ReputationRegistry`

**Chain:** Pharos Atlantic Testnet · **Chain ID:** `688689`

## Live URLs

| Resource | URL |
|---|---|
| Dashboard | https://web-eight-eta-26.vercel.app |
| Block explorer | https://atlantic.pharosscan.xyz |
| Docs index | [docs/README.md](../README.md) |

Replace skill/indexer URLs with the team's Render deployment if provided in submission.

## Step 1: Verify Deployed Contracts (2 min)

Open each address on PharosScan — confirm bytecode exists:

| Contract | Address |
|---|---|
| IdentityRegistry | [0x0554…d323](https://atlantic.pharosscan.xyz/address/0x05545F026b75f03aE9Cf1eA8a8373473c94ed323) |
| CovenantRegistry | [0x068b…5770](https://atlantic.pharosscan.xyz/address/0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770) |
| DecisionLog | [0x8A80…d603](https://atlantic.pharosscan.xyz/address/0x8A80D270dd7028536ecB6f92b04eec11F929d603) |
| ReputationRegistry | [0x92b8…A973](https://atlantic.pharosscan.xyz/address/0x92b8815A17D85E45DB5Da9952764Ee2ce072A973) |
| GuardedExecutor | [0x2741…d2d2F](https://atlantic.pharosscan.xyz/address/0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F) |

## Step 2: Click Live Demo Transactions (3 min)

| Step | Link |
|---|---|
| Deploy IdentityRegistry | [tx](https://atlantic.pharosscan.xyz/tx/0x96191956ae65e47ceb25a710bd9410a8bc6647e497dff6eed883cf5514be85ec) |
| Register demo agent | [tx](https://atlantic.pharosscan.xyz/tx/0x53e91cf1a0dace92fc2bbf4601fa09912af522d8e7147e458a7ff62edf7f1756) |
| Set covenant | [tx](https://atlantic.pharosscan.xyz/tx/0x86a7ed75957452f81dcf95f92fab8116aa7e7da2f36ed9317ca670275728857e) |
| Guarded execution (ALLOW) | [tx](https://atlantic.pharosscan.xyz/tx/0x1ff0fa3f3c0d3957b7e8ee21b9402b5f5051fc428cf3f822eda25c24feba0f8b) |

**Breach demo:** Team should show a tx that reverted with `CovenantBreach()` (wrong covenant hash or missing attestation).

## Step 3: Health Check (1 min)

If the team provided a skill server URL:

```bash
curl -s https://YOUR-SKILL.onrender.com/health | jq
```

Expect:
- `"status": "ok"`
- `"attester": { "match": true, "balanceWei": ">0" }`
- `"rpc": { "chainId": 688689 }`

## Step 4: REST API Smoke Test (3 min)

```bash
SKILL=https://YOUR-SKILL.onrender.com

# List agents
curl -s "$SKILL/api/agents" | jq '.agents | length'

# List decisions with stats
curl -s "$SKILL/api/decisions?limit=5" | jq '.stats'

# Preflight (read-only verdict — use team's sample body or below)
curl -s -X POST "$SKILL/api/preflight" \
  -H "Content-Type: application/json" \
  -d @sample-preflight.json | jq '.verdict, .violations'
```

See [API_REFERENCE.md](../API_REFERENCE.md) for full request shapes.

## Step 5: Dashboard (2 min)

1. Open https://web-eight-eta-26.vercel.app (or team URL)
2. Confirm health indicator shows connected
3. View agents, covenants, decision feed
4. Click through to PharosScan proof links

**Note:** Dashboard is React + Vite. It reads from the skill REST API, not directly from chain.

## Step 6: Security Claims (3 min)

Verify these are real in code/docs:

| Claim | Evidence |
|---|---|
| LLM cannot ALLOW | [SECURITY.md](../SECURITY.md), `packages/skill/test/explainer.test.ts` |
| Non-custodial | Owner keys passed per-request; attester signs attestations only |
| Egress allowlist | `packages/skill/src/egress.ts` |
| On-chain enforcement | GuardedExecutor revert `CovenantBreach()` |
| CertiK | Status: `WAITING_FOR_OFFICIAL_ACCESS` — adapter exists, scan pending |

## Step 7: MCP Tools (optional, 2 min)

If testing locally with repo clone:

```bash
pnpm install && pnpm generate:abis && pnpm build
MCP_STDIO_ENABLED=true pnpm dev:skill
```

Connect via Cursor MCP — 9 tools listed in [MCP_REFERENCE.md](../MCP_REFERENCE.md).

## Scoring Rubric Hints

| Criterion | What to look for |
|---|---|
| **Pharos alignment** | Real testnet txs, on-chain enforcement, not mock |
| **Security** | Deterministic core, LLM excluded from ALLOW, egress declared |
| **Composability** | MCP tools: `preflight`, `reputation`, `getReceipt` |
| **Innovation** | Closed loop: covenant → certify → execute → receipt → Trust Capital |
| **Polish** | Working dashboard, docs, live demo arc |

## Red Flags

- No on-chain txs / placeholder addresses
- Preflight returns ALLOW without attestation signature
- Dashboard errors on all API calls (misconfigured `VITE_API_URL`)
- Claims full CertiK PASS without badge (currently waiting for access)

## Questions for the Team

1. What is your public skill server URL?
2. Can you show a live breach revert on PharosScan?
3. How does GoPlus `unknown` on Pharos affect your demo covenant?
4. When will CertiK scanner access be available?

## Related Docs

- [DEMO_GUIDE.md](./DEMO_GUIDE.md)
- [API_REFERENCE.md](../API_REFERENCE.md)
- [ARCHITECTURE.md](../ARCHITECTURE.md)
