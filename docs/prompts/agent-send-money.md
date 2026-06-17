# Agent Send Money Prompt

Full PHRS send workflow with COVENANT guardrails.

```text
Send PHRS on Pharos Atlantic using COVENANT. No private keys.

## Inputs (ask once if missing)

- AGENT_ADDRESS — on-chain linked agent (<YOUR_AGENT_ADDRESS>)
- RECIPIENT — recipient address
- VALUE_WEI — amount in wei
- WALLET — owner wallet for SIWE (<YOUR_WALLET_ADDRESS>)
- NONCE — unique timestamp (default: current Unix time)

Note: If owner wallet has a linked agent on IdentityRegistry, use that agent address — not the wallet address — in intents.

## Workflow

1. covenant_health
2. covenant_reputation for AGENT_ADDRESS
3. covenant_preflight — intent + covenant allowlisting RECIPIENT (see agent-risk-review for covenant template)
4. If DENY → stop and explain violations.
5. If ALLOW or WARN:
   a. covenant_sign_attestation
   b. covenant_connect_wallet for WALLET → print connectUrl, wait for user
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
- Do not skip preflight or attestation.
```
