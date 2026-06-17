# Send Transaction Prompt

```text
Use Covenant before sending a Pharos transaction.

Input I will provide:
- agent address
- recipient or contract address
- value in wei
- calldata, or `0x` for a native transfer
- Covenant sessionId if already connected

Workflow:
1. Call `covenant_health`.
2. Call `covenant_reputation` for the agent.
3. Call `covenant_verify_counterparty` for the recipient or target.
4. Call `covenant_simulate`.
5. Call `covenant_preflight`.
6. If verdict is `DENY`, stop and explain.
7. If verdict is `WARN`, ask me whether to continue.
8. If verdict is `ALLOW`, call `covenant_sign_attestation`.
9. Call `covenant_request_approval` with the sessionId and executionPayload.
10. Give me the returned `approvalUrl`.
11. After I approve in wallet, call `covenant_execute_authorized`.
12. If a decisionId is available, call `covenant_get_receipt`.

Rules:
- Never ask for a private key or seed phrase.
- Never invent an approval URL.
- Do not bypass Covenant preflight.
```
