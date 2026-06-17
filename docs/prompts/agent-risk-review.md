# Risk review workflow (agent prompt)

Audit an agent action before execution.

Tools: `covenant_health` → `covenant_reputation` → `covenant_simulate` → `covenant_preflight`

Report: verdict, violations[], intentHash, simulation.gasEstimate

If DENY: stop and explain violations to user.
