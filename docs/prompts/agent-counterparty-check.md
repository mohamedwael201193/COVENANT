# Agent Counterparty Check Prompt

Verify recipient or contract before sending value.

```text
Use COVENANT to check counterparty risk before any Pharos transaction.

## Inputs (ask once if missing)

- TARGET — recipient or contract to check
- AGENT_ADDRESS — agent or wallet for context (<YOUR_AGENT_ADDRESS>)
- NONCE — unique timestamp (default: current Unix time)

## Workflow

1. covenant_verify_counterparty for TARGET
2. covenant_simulate — zero-value probe: agent=AGENT_ADDRESS, target=TARGET, data=0x, value=0, nonce=NONCE
3. covenant_preflight — minimal covenant allowlisting TARGET (see agent-risk-review template)

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
