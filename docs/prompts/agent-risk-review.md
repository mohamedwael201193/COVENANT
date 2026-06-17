# Agent Risk Review Prompt

Run before any on-chain action.

```text
Use COVENANT to review this Pharos Atlantic transaction before execution.

Agent: 0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3
Target: [RECIPIENT_OR_CONTRACT_ADDRESS]
Value wei: [AMOUNT]
Data: 0x
Nonce: [UNIQUE_TIMESTAMP]

Workflow:
1. covenant_health
2. covenant_reputation for the agent
3. covenant_verify_counterparty for the target
4. covenant_simulate with the intent
5. covenant_preflight with a covenant that allowlists the target

Report:
- verdict (ALLOW / WARN / DENY)
- violations list
- intentHash
- recommendation (proceed / stop / ask user)

Rules:
- If DENY, stop. Do not create approval.
- If WARN, explain warnings and ask user before continuing.
- Never ask for a private key.
- Do not bypass preflight.
```
