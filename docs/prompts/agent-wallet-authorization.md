# Agent Wallet Authorization Prompt

SIWE session + approval URL — no private keys.

```text
Use COVENANT to authorize my wallet for guarded execution on Pharos Atlantic.

## Inputs (ask once if missing)

- WALLET — Pharos wallet address (<YOUR_WALLET_ADDRESS>)
- AGENT_ADDRESS — on-chain agent for intents (<YOUR_AGENT_ADDRESS>)
- TARGET, VALUE_WEI, NONCE — for the intended transaction (ask if doing approval)

Chain: 688689 (Pharos Atlantic — NOT 688545)

## Session

1. covenant_connect_wallet for WALLET.
2. Print clearly:

   ==================================================
   USER ACTION REQUIRED — WALLET CONNECT
   connectUrl: [FULL URL from tool]
   nonce: [NONCE]
   ==================================================

3. STOP. Wait for user to sign SIWE in browser and reply DONE.
4. covenant_create_session with signature, message, nonce.

## Approval (after preflight ALLOW or WARN)

5. covenant_preflight for the intended transaction (build covenant per agent-risk-review template).
6. If ALLOW or WARN: covenant_sign_attestation.
7. covenant_request_approval with sessionId and executionPayload.
8. Print:

   ==================================================
   USER ACTION REQUIRED — EXECUTION APPROVAL
   approvalUrl: [FULL URL from tool]
   ==================================================

9. STOP. Wait for user to approve in MetaMask on chain 688689.
10. covenant_execute_authorized or poll approval status.
11. covenant_get_receipt when decisionId is available.

## Rules

- Never ask for private key or seed phrase.
- Never execute after DENY.
- Never invent URLs — only use tool responses.
- If approval is pending, wait for user. Do not retry execution yourself.
- Use linked agent address in intents when owner wallet maps to a registered agent.
```
