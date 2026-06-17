# COVENANT — Proof of Execution

**Date:** 2026-06-17  
**Verifier:** Third-party agent (clean install from npm + hosted MCP)  
**Result:** End-to-end production proof **PASSED**

---

## Success criteria checklist

| Criterion | Evidence |
|---|---|
| Real wallet connection (SIWE) | Session `sess_852f4abe609c06016a8a3509` |
| Real session | Postgres-backed, API verified |
| Real approval + page | `appr_44c32fd54ab957a63bf9ea7d` HTTP 200 |
| Real user wallet signature | MetaMask confirm on Atlantic Testnet |
| Real `txHash` | `0x1c5a7e9d00c29070c0508b47524c32284b983022b43ac338e4afe15ee7bebd1c` |
| Real DecisionLog entry | `decisionId: 1` |
| Real receipt via API | `GET /api/receipt/1` |

---

## Wallet & session

| Field | Value |
|---|---|
| Owner wallet | `0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3` |
| Linked agent (on-chain) | `0xfBb4A658f89736eD40CAAAD735bcedb3272C4600` |
| sessionId | `sess_852f4abe609c06016a8a3509` |
| Permissions | `reputation`, `simulate`, `preflight`, `execute` |
| Session expires | `2026-06-24T15:26:31.936Z` |

**Connect URL used:**

```
https://covenant-web-mu.vercel.app/connect?address=0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3&nonce=49c19e8a0aeb6983e9aa760e7b8a735d
```

---

## Approval & preflight

| Field | Value |
|---|---|
| approvalId | `appr_44c32fd54ab957a63bf9ea7d` |
| approvalUrl | https://covenant-web-mu.vercel.app/approve/appr_44c32fd54ab957a63bf9ea7d |
| Verdict | `WARN` (reputation timeout warning; execution allowed) |
| intentHash | `0xe698c3c90c0b010d7259bdaf9453fbefd0f9db4db1d5593f81f002d7aac3dab4` |
| covenantHash (on-chain) | `0xd338973bd2ea16e14adb87429a2b8b75cb8a10743c0df742f6aa2a1998877459` |
| Target | `0x0000000000000000000000000000000000000001` |
| Value | `0` wei |

---

## On-chain execution

| Field | Value |
|---|---|
| txHash | `0x1c5a7e9d00c29070c0508b47524c32284b983022b43ac338e4afe15ee7bebd1c` |
| Explorer | https://atlantic.pharosscan.xyz/tx/0x1c5a7e9d00c29070c0508b47524c32284b983022b43ac338e4afe15ee7bebd1c |
| Block | `24401640` |
| Status | `success` |
| Gas used | `214,083` |
| Network fee | `0.00214083 PHRS` |
| Chain ID | `688689` (Pharos Atlantic) |

---

## Decision log & receipt

| Field | Value |
|---|---|
| decisionId | `1` |
| Agent | `0xfBb4A658f89736eD40CAAAD735bcedb3272C4600` |
| Verdict | `ALLOW` |
| intentHash | `0xe698c3c90c0b010d7259bdaf9453fbefd0f9db4db1d5593f81f002d7aac3dab4` |

**API receipt (`GET /api/receipt/1`):**

```json
{
  "id": "1",
  "agent": "0xfBb4A658f89736eD40CAAAD735bcedb3272C4600",
  "intentHash": "0xe698c3c90c0b010d7259bdaf9453fbefd0f9db4db1d5593f81f002d7aac3dab4",
  "verdict": "ALLOW",
  "reasonHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "outcomeHash": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
  "timestamp": "1781712215"
}
```

**Decisions index (`GET /api/decisions?limit=3`):** `total: 2`, `allow: 2`

---

## Deployed contracts (Pharos Atlantic)

| Contract | Address |
|---|---|
| IdentityRegistry | `0x05545F026b75f03aE9Cf1eA8a8373473c94ed323` |
| CovenantRegistry | `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770` |
| GuardedExecutor | `0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F` |
| DecisionLog | `0x8A80D270dd7028536ecB6f92b04eec11F929d603` |
| ReputationRegistry | `0x92b8815A17D85E45DB5Da9952764Ee2ce072A973` |
| Attester | `0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3` |

---

## Published packages (npm)

| Package | Version |
|---|---|
| `covenant-mcp` | `0.2.7` |
| `covenant-skill` | `0.2.7` |
| `covenant-shared` | `0.2.7` |

Install: `npx covenant-mcp init`

---

## Production endpoints

| Service | URL |
|---|---|
| Skill API | https://covenant-skill.onrender.com |
| Hosted MCP | https://covenant-skill.onrender.com/mcp |
| Web UI | https://covenant-web-mu.vercel.app |
| RPC | https://atlantic.dplabs-internal.com |
| Explorer | https://atlantic.pharosscan.xyz |

---

## MCP tools discovered (17)

```
covenant_health
covenant_reputation
covenant_preflight
covenant_simulate
covenant_verify_counterparty
covenant_get_receipt
covenant_sign_attestation
covenant_connect_wallet
covenant_create_session
covenant_request_approval
covenant_get_pending_approvals
covenant_execute_authorized
covenant_revoke_session
covenant_register_identity
covenant_set_covenant
covenant_rotate_key
covenant_attest_outcome
```

---

## Phase results

| Phase | Result |
|---|---|
| 1 — Environment validation | PASS — npm `0.2.7`, 17 tools |
| 2 — Skill validation | PASS — health, reputation, simulate, preflight |
| 3 — Wallet authorization | PASS — SIWE connectUrl, user signed |
| 4 — Session creation | PASS — `sess_852f4abe609c06016a8a3509` |
| 5 — Pre-flight workflow | PASS — ALLOW/WARN + intentHash |
| 6 — Attestation | PASS — hosted attester signature |
| 7 — Approval creation | PASS — backend + page verified |
| 8 — User approval | PASS — MetaMask confirm |
| 9 — On-chain execution | PASS — tx mined block 24401640 |
| 10 — Receipt validation | PASS — decisionId `1`, API receipt |
| 11 — Proof package | PASS — this document |

---

## Issues found & fixed during proof

| Issue | Fix |
|---|---|
| `covenant_sign_attestation` BigInt serialization (`0.2.6`) | `jsonSafeStringify` in `0.2.7` |
| SIWE domain mismatch (`covenant.pharos` vs host) | Use dashboard hostname |
| Wrong chain hex `0xa81a1` (688545) | Corrected to `0xa8231` (688689) |
| Stale Vercel alias serving old bundle | Redeployed + repointed `covenant-web-mu` |
| Agent not registered / wrong agent address | Use `agentOfOwner` linked agent |
| `register` reverted (`owner has agent`) | Skip re-register; use existing agent |
| Gas limit 20M on revert | Simulate first + cap gas |

---

## Screenshots

- Wallet connect + session: `assets/image-a0390f9a-90ea-4b36-9c29-c5d38ffbb3d5.png`
- Approval ready + MetaMask confirm: `assets/image-d21d3fe3-5ea5-4946-be63-b35edf810500.png`
- PharosScan success + MetaMask confirmed: `assets/image-ce37005b-7ccb-487f-863d-ce90c9d7fdaf.png`

---

## Judge verification commands

```bash
# Health
curl -s https://covenant-skill.onrender.com/health

# Approval executed
curl -s https://covenant-skill.onrender.com/api/approvals/appr_44c32fd54ab957a63bf9ea7d

# Receipt
curl -s https://covenant-skill.onrender.com/api/receipt/1

# On-chain tx
open https://atlantic.pharosscan.xyz/tx/0x1c5a7e9d00c29070c0508b47524c32284b983022b43ac338e4afe15ee7bebd1c
```
