# Wallet Setup Prompt

```text
Use Covenant to create a wallet authorization session.

GitHub: https://github.com/mohamedwael201193/COVENANT

Steps:
1. Make sure Covenant MCP is installed with `npx -y covenant-mcp init`.
2. Ask me for my public wallet address only.
3. Call `covenant_connect_wallet` with that address.
4. Give me the returned `connectUrl`.
5. Tell me to open the URL, connect my wallet, and sign the SIWE message.
6. After I return a `sessionId`, store it for later approval requests.

Rules:
- Never ask for my private key or seed phrase.
- Do not create a transaction in this step.
- If the connect URL fails, report the exact URL and error.
```
