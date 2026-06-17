# Covenant policy audit (agent prompt)

Verify agent covenant matches on-chain hash before preflight.

1. Read covenant from chain / dashboard API
2. `covenant_preflight` with matching `covenant` + `covenantHash`
3. Compare tier limits vs `covenant_reputation` score

Flag mismatches as DENY-equivalent even if simulation passes.
