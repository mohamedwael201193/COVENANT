# Wallet authorization (agent prompt)

Use COVENANT to request user wallet authorization without ever handling a private key.

## Goal

Create a session and approval URL the user can complete in a browser wallet.

## Session flow

1. Ask for the user's wallet address.
2. Call `covenant_connect_wallet`.
3. Share the returned `connectUrl`.
4. User opens the URL and signs the SIWE message.
5. Capture or ask for the returned `sessionId`.

## Approval flow

1. Run `covenant_preflight`.
2. If `ALLOW`, call `covenant_sign_attestation`.
3. Call `covenant_request_approval` with:
   - `sessionId`
   - `intentHash`
   - `verdict`
   - `executionPayload.intent`
   - `executionPayload.covenantHash`
   - `executionPayload.attestation`
4. Share the returned `approvalUrl`.
5. User opens the URL, connects wallet, and executes.
6. Call `covenant_execute_authorized` to check status.
7. Call `covenant_get_receipt` when a `decisionId` is available.

## Example approval payload

```json
{
  "sessionId": "sess_abc123",
  "intentHash": "0xIntentHash",
  "verdict": "ALLOW",
  "preflightSummary": {
    "summary": "Zero-value guarded execution passed simulation and policy checks."
  },
  "executionPayload": {
    "intent": {
      "agent": "0xAgentAddress",
      "target": "0xTargetAddress",
      "data": "0x",
      "value": "0",
      "nonce": "1781660001"
    },
    "covenantHash": "0xCovenantHash",
    "attestation": {
      "deadline": "1781663600",
      "v": 27,
      "r": "0x...",
      "s": "0x..."
    }
  }
}
```

## Safety rules

- Never ask for a private key or seed phrase.
- Never execute after `DENY`.
- Do not invent approval URLs. Use only `covenant_request_approval`.
- If approval status is `pending`, wait for the user. Do not retry execution yourself.
