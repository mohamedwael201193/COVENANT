# 02 — Validate COVENANT Skills

**Copy everything inside the box below into Cursor after Prompt 01 succeeds.**

```text
Demonstrate the power of COVENANT Skills on Pharos Atlantic.

Use MCP tools only. Do not create scripts. Do not generate code.
Do not debug the environment. Do not inspect package internals or source code.
Treat COVENANT as a trusted Skill already installed.

## Inputs

Ask ONCE if not already provided:
- AGENT = <YOUR_AGENT_ADDRESS>

If none provided, use this public Pharos contract probe:
AGENT = 0x05545F026b75f03aE9Cf1eA8a8373473c94ed323
TARGET = 0x0000000000000000000000000000000000000001
NONCE = current Unix timestamp as string

## Run these tools in order (measure latency for each)

### 1. covenant_health
Show: input (none), output, latency ms.
Explain: readiness check for the COVENANT Skill on Pharos Atlantic.

### 2. covenant_reputation
Input: { agent: AGENT }
Show: input, output, latency ms.
Explain: Trust Capital — why Pharos Agents need reputation before moving value.

### 3. covenant_simulate
Input: intent { agent: AGENT, target: TARGET, data: "0x", value: "0", nonce: NONCE }
Show: input, output, latency ms.
Explain: dry-run execution without spending gas.

### 4. covenant_preflight
Input: same intent + minimal covenant:
  version "1", agent and owner = AGENT
  allowlist [TARGET], denylist []
  baseMaxValueWei "1000000000000000000"
  tierLimits [{ tier: 1, maxValueWei: "1000000000000000000" }]
  minCounterpartyTier 0, timeWindows [], requiredChecks ["simulation"]
  createdAt current ISO timestamp
  covenantHash 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
Show: input summary, output (verdict, violations, intentHash), latency ms.
Explain: deterministic ALLOW / WARN / DENY — the core safety gate for Pharos Agents.

### 5. covenant_verify_counterparty
Input: { address: TARGET }
Show: input, output, latency ms.
Explain: recipient risk signals before interacting with unknown addresses.

## Final report

### Skill Summary
[One paragraph: what COVENANT Skills enable for Pharos Agents]

### Trust Summary
[Reputation tier, score, what it means]

### Risk Summary
[Preflight verdict, key violations, simulate result]

### Agent Readiness Score
| Dimension | Score (1-10) | Notes |
|-----------|--------------|-------|
| MCP connected | | |
| Trust Capital | | |
| Simulation | | |
| Preflight | | |
| Counterparty | | |
| **Overall** | | |

Execute immediately. Do not ask for private keys.
```
