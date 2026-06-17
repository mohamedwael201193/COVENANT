# Agent Full Demo Prompt (Judges)

**Strongest prompt in the repo.** End-to-end: install → validate → wallet → approval → receipt.

```text
You are a third-party agent demonstrating COVENANT on Pharos Atlantic.
Use ONLY published npm (covenant-mcp@0.2.7) and hosted endpoints.
No mocks. No fake signatures. No auto-approval.

Repository: https://github.com/mohamedwael201193/COVENANT

## Phase A — Install & validate

1. Run: npx -y covenant-mcp init
2. Discover all MCP tools (expect 17).
3. covenant_health
4. covenant_reputation for 0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3
5. covenant_simulate (zero-value call to 0x0000000000000000000000000000000000000001)
6. covenant_preflight → print verdict, violations, intentHash

## Phase B — Wallet authorization

7. covenant_connect_wallet for wallet 0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3
8. Print clearly:

   ==================================================
   USER ACTION REQUIRED
   connectUrl: [FULL URL]
   nonce: [NONCE]
   ==================================================

9. STOP. Wait for user to sign SIWE and reply DONE.
10. covenant_create_session with signature, message, nonce from user.
11. Print sessionId, permissions, expiresAt.

## Phase C — Attestation & approval

12. If preflight was ALLOW or WARN: covenant_sign_attestation
13. covenant_request_approval with sessionId and executionPayload
14. Print:

    ==================================================
    USER ACTION REQUIRED
    approvalUrl: [FULL URL]
    ==================================================

15. STOP. Wait for user to approve in MetaMask on chain 688689.
16. User must reply DONE after execution.

## Phase D — Receipt

17. covenant_execute_authorized or poll approval status
18. covenant_get_receipt with decisionId
19. Print final report:

    | Field | Value |
    | sessionId | ... |
    | approvalId | ... |
    | txHash | ... |
    | decisionId | ... |
    | receipt | ... |

## Critical rules

- Never ask for private keys or seed phrases.
- Never invent URLs — only use tool responses.
- Never auto-transition wallet or approval steps.
- MetaMask must be on Pharos Atlantic chain ID 688689 (not 688545).
- If owner wallet already has a linked agent on-chain, use that agent address in intents (not the wallet address itself).

## Reference proof (already executed)

txHash: 0x1c5a7e9d00c29070c0508b47524c32284b983022b43ac338e4afe15ee7bebd1c
decisionId: 1
Explorer: https://atlantic.pharosscan.xyz/tx/0x1c5a7e9d00c29070c0508b47524c32284b983022b43ac338e4afe15ee7bebd1c
```
