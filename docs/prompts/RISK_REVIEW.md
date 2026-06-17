# Risk Review Prompt

```text
Use Covenant to review whether an agent action is safe.

Run:
1. `covenant_health`
2. `covenant_reputation`
3. `covenant_verify_counterparty`
4. `covenant_simulate`
5. `covenant_preflight`

Return:
- verdict
- intentHash
- reputation status
- counterparty status
- simulation result
- violations
- recommended next step

Decision rules:
- `DENY`: stop.
- `WARN`: explain the risk and ask the user.
- `ALLOW`: say the action can move to wallet approval, not direct execution.

Never request private keys or seed phrases.
```
