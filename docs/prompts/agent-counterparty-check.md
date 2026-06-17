# Agent Counterparty Check Prompt

Verify recipient or contract before sending value.

```text
Use COVENANT to check counterparty risk before any Pharos transaction.

Target address: [RECIPIENT_OR_CONTRACT]
Agent: [AGENT_ADDRESS]

## Workflow

1. covenant_verify_counterparty for the target
2. covenant_simulate with zero-value probe intent to the target
3. covenant_preflight with covenant allowlisting the target

## Report

| Signal | Value |
| GoPlus status | ... |
| simulate success | ... |
| preflight verdict | ... |
| violations | ... |
| recommendation | proceed / warn user / stop |

## Rules

- If GoPlus is skipped (no API key), note GOPLUS_SKIPPED — treat as WARN, not ALLOW.
- If DENY, do not proceed to approval.
- Never ask for private keys.
```
