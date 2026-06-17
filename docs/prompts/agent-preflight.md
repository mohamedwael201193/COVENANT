# Transaction preflight (agent prompt)

Use COVENANT to evaluate an on-chain intent before any wallet approval.

## Goal

Return a deterministic `ALLOW`, `WARN`, or `DENY` and explain what the user should do next.

## Tool sequence

1. `covenant_health`
2. `covenant_reputation`
3. `covenant_simulate`
4. `covenant_preflight`

## Example prompt to user

```text
I will run a COVENANT preflight before this Pharos action. This does not move funds and does not require your private key.
```

## Example tool payload

```json
{
  "intent": {
    "agent": "0xAgentAddress",
    "target": "0xTargetAddress",
    "data": "0x",
    "value": "0",
    "nonce": "1781660001"
  },
  "covenantHash": "0xCovenantHash",
  "covenant": {
    "version": "1",
    "agent": "0xAgentAddress",
    "owner": "0xOwnerAddress",
    "allowlist": ["0xTargetAddress"],
    "denylist": [],
    "baseMaxValueWei": "1000000000000000000",
    "tierLimits": [{ "tier": 1, "maxValueWei": "1000000000000000000" }],
    "minCounterpartyTier": 0,
    "timeWindows": [],
    "requiredChecks": ["simulation"],
    "createdAt": "2026-06-17T00:00:00.000Z"
  }
}
```

## Response rules

- If `DENY`, stop. Do not create an approval URL.
- If `WARN`, explain what needs manual review.
- If `ALLOW`, continue to `covenant_sign_attestation` and `covenant_request_approval`.
- Never ask the user for a private key, seed phrase, or wallet export.
