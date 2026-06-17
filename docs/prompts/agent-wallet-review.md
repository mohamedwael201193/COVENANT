# Wallet onboarding (agent prompt)

Connect user wallet via SIWE — no private keys in chat.

1. Ask user for wallet address
2. `covenant_connect_wallet` → share `connectUrl` or `message` for signing
3. After user signs in wallet: `covenant_create_session` with signature + nonce
4. Store `sessionId` for approval flows

Permissions: `reputation`, `simulate`, `preflight`, `execute`  
Duration: 7–30 days typical

Revoke anytime: `covenant_revoke_session`
