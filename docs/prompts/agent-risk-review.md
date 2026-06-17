# Agent Risk Review Prompt

Run before any on-chain action.

```text
Use COVENANT to review this Pharos Atlantic transaction before execution.

## Inputs (ask once if missing)

- AGENT_ADDRESS — on-chain agent or wallet to evaluate (<YOUR_AGENT_ADDRESS>)
- TARGET — recipient or contract address
- VALUE_WEI — amount in wei (default: 0 for probe)
- NONCE — unique timestamp (default: current Unix time)

## Workflow

1. covenant_health
2. covenant_reputation for AGENT_ADDRESS
3. covenant_verify_counterparty for TARGET
4. covenant_simulate — intent: agent=AGENT_ADDRESS, target=TARGET, data=0x, value=VALUE_WEI, nonce=NONCE
5. covenant_preflight — build minimal covenant:
   - version "1", agent and owner = AGENT_ADDRESS
   - allowlist: [TARGET], denylist: []
   - baseMaxValueWei: at least VALUE_WEI (or "1000000000000000000" if zero)
   - tierLimits: [{ tier: 1, maxValueWei: "1000000000000000000" }]
   - minCounterpartyTier: 0, timeWindows: [], requiredChecks: ["simulation"]
   - createdAt: current ISO timestamp
   - covenantHash: 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
   (Use on-chain covenantHash if user provides one.)

## Report

- verdict (ALLOW / WARN / DENY)
- violations list
- intentHash
- recommendation (proceed / stop / ask user)

## Rules

- If DENY, stop. Do not create approval.
- If WARN, explain warnings and ask user before continuing.
- Never ask for a private key.
- Do not bypass preflight.
```
