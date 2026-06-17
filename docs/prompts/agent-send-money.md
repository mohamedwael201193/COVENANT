# Send money with COVENANT (agent prompt)

You have COVENANT MCP tools. Send PHRS on Pharos **without private keys**.

## Steps

1. `covenant_reputation` — check agent Trust Capital tier
2. `covenant_preflight` — get ALLOW/WARN/DENY (works with zero setup)
3. If ALLOW: `covenant_sign_attestation` — hosted attestation (default API)
4. `covenant_connect_wallet` + `covenant_create_session` — if user not onboarded
5. `covenant_request_approval` — get approvalUrl for user
6. User opens approvalUrl and signs in wallet
7. `covenant_execute_authorized` — confirm approval
8. `covenant_get_receipt` — audit on-chain

## Example preflight

```json
{
  "intent": {
    "agent": "0xYourAgent",
    "target": "0xRecipient",
    "data": "0x",
    "value": "10000000000000000",
    "nonce": "1700000001"
  },
  "covenantHash": "0x...",
  "covenant": { "version": "1", "...": "..." }
}
```

Never ask the user for a private key or seed phrase.
