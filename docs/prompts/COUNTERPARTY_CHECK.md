# Counterparty Check Prompt

```text
Use Covenant to check this Pharos counterparty before any transfer or contract call.

Address: <paste address here>

Steps:
1. Call `covenant_verify_counterparty`.
2. If the address is also an agent, call `covenant_reputation`.
3. Explain whether the result is safe, warning, malicious, unknown, or unavailable.
4. Tell me that counterparty check alone is not authorization.
5. Recommend `covenant_preflight` before any transaction.

Rules:
- Do not ask for private keys.
- Do not approve a payment from counterparty data alone.
- If GoPlus is unavailable, say that the check was skipped and preflight is still required.
```
