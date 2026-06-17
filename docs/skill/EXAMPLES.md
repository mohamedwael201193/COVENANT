# Agent-Ready Examples

## Flow: Agent sends money

### 1. User request

> Send 0.01 PHRS from my agent to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb.

### 2. covenant_reputation

**Input:**
```json
{ "agent": "0xYourAgentAddress" }
```

**Output:**
```json
{
  "agent": "0xYourAgentAddress",
  "score": "20",
  "tier": 1,
  "updatedAt": "1710000000"
}
```

### 3. covenant_preflight

**Input:**
```json
{
  "intent": {
    "agent": "0xYourAgentAddress",
    "target": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "data": "0x",
    "value": "10000000000000000",
    "nonce": "1700000001"
  },
  "covenantHash": "0xabc...",
  "covenant": { "version": "1", "agent": "0x...", "owner": "0x...", "...": "..." },
  "deadlineSeconds": 3600
}
```

**Output (ALLOW):**
```json
{
  "verdict": "ALLOW",
  "intentHash": "0xdef...",
  "violations": [],
  "simulation": { "success": true, "gasEstimate": "21000" },
  "attestation": {
    "agent": "0x...",
    "intentHash": "0xdef...",
    "verdict": 0,
    "deadline": "1700003600",
    "signature": "0x..."
  }
}
```

**Output (DENY):**
```json
{
  "verdict": "DENY",
  "violations": [{ "code": "VALUE_EXCEEDS_TIER_LIMIT", "message": "..." }],
  "attestation": null
}
```

### 4. Execute (client-side)

Submit `GuardedExecutor.execute(intent, attestation)` with the signed attestation. COVENANT does not custody keys for the agent's execution tx.

### 5. covenant_get_receipt

**Input:**
```json
{ "decisionId": "42" }
```

**Output:**
```json
{
  "id": "42",
  "agent": "0x...",
  "intentHash": "0xdef...",
  "verdict": 0,
  "timestamp": "1700000100"
}
```

---

## Flow: Onboard new agent

1. `covenant_register_identity` — register agent + metadata URI
2. `covenant_set_covenant` — publish policy hash to chain
3. `covenant_preflight` — first guarded action

---

## Flow: Counterparty risk review

1. `covenant_verify_counterparty` — GoPlus signal
2. `covenant_simulate` — dry-run calldata
3. `covenant_preflight` — full policy + attestation

---

## When NOT to call each tool

| Tool | Do not use when |
|---|---|
| `covenant_preflight` | You only need gas estimate (use simulate) |
| `covenant_simulate` | You need authorization (use preflight) |
| `covenant_reputation` | You need ALLOW/DENY (use preflight) |
| `covenant_attest_outcome` | You are not the authorized oracle |

---

## Hosted REST fallback (read-only)

Production skill API (no local keys for reads):

```bash
curl -s https://covenant-skill.onrender.com/api/reputation/0xAgentAddress
curl -s -X POST https://covenant-skill.onrender.com/api/preflight -H 'Content-Type: application/json' -d @intent.json
```

MCP is preferred for agent composability; REST for scripts and demos.
