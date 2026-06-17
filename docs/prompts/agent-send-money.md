# Agent Send Money Prompt

Full PHRS send workflow with COVENANT guardrails.

```text
Send PHRS on Pharos Atlantic using COVENANT. No private keys.

Agent (linked on-chain): [AGENT_ADDRESS]
Recipient: [RECIPIENT_ADDRESS]
Amount wei: [VALUE_WEI]
Nonce: [UNIQUE_TIMESTAMP]

## Workflow

1. covenant_health
2. covenant_reputation for the agent
3. covenant_preflight with intent (agent, target, value, data: 0x, nonce) and covenant allowlisting recipient
4. If DENY → stop and explain violations.
5. If ALLOW or WARN:
   a. covenant_sign_attestation
   b. covenant_connect_wallet (if no session) → print connectUrl, wait for user
   c. covenant_create_session after SIWE
   d. covenant_request_approval → print approvalUrl, wait for user
   e. covenant_execute_authorized after user approves
   f. covenant_get_receipt with decisionId

## Report

| Step | Status | Details |
| preflight verdict | ... |
| intentHash | ... |
| sessionId | ... |
| approvalId | ... |
| txHash | ... |
| receipt | ... |

## Rules

- Never ask for private key or seed phrase.
- MetaMask must be on chain 688689.
- Use linked agent address from IdentityRegistry, not owner wallet as agent field.
- Do not skip preflight or attestation.
```
