# Request Approval

```text
Request wallet approval for a COVENANT-guarded transaction.

Prerequisites: preflight ALLOW or WARN, signed attestation, active sessionId.

Ask once if missing:
- sessionId (from covenant_create_session)
- AGENT = <YOUR_AGENT_ADDRESS>
- TARGET = <TARGET_ADDRESS>
- VALUE_WEI, nonce, covenantHash, attestation from prior preflight/sign steps

Steps:
1. covenant_request_approval with sessionId and executionPayload (intent, covenantHash, attestation)
2. Print:

   ==================================================
   USER ACTION REQUIRED
   approvalUrl: [full URL from tool]
   Chain: 688689
   ==================================================

3. STOP. Wait for user to approve in browser wallet.
4. covenant_execute_authorized or poll status.
5. covenant_get_receipt when decisionId is available.

Never ask for private keys. Never invent approval URLs.
```
