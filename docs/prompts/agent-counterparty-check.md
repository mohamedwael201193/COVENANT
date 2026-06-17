# Counterparty risk review (agent prompt)

Use COVENANT before interacting with an unknown contract or EOA.

1. `covenant_verify_counterparty` — GoPlus signal (skipped gracefully if no keys)
2. `covenant_simulate` — dry-run calldata
3. `covenant_preflight` — policy verdict

If GoPlus is skipped, note `GOPLUS_SKIPPED` in violations and treat as WARN.
