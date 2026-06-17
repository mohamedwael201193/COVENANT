---
name: covenant
description: Trust rail for autonomous agents on Pharos — preflight, attestation, reputation, receipts
version: 0.1.0
chain: pharos-atlantic
chainId: 688689
install: npx covenant-mcp init
---

# COVENANT MCP Skill

**Stripe for Agent Trust** on Pharos Atlantic.

## Install

```bash
npx covenant-mcp init
```

## Tools

- `covenant_health` — connectivity check
- `covenant_reputation` — Trust Capital tier
- `covenant_preflight` — ALLOW/WARN/DENY + signed attestation
- `covenant_simulate` — eth_call debug
- `covenant_verify_counterparty` — GoPlus risk
- `covenant_get_receipt` — DecisionLog audit
- `covenant_register_identity` / `covenant_set_covenant` / `covenant_rotate_key` — onboarding
- `covenant_attest_outcome` — oracle reputation

## Workflow

```
reputation → preflight → execute → receipt
```

## Docs

- [5-min install](../../docs/skill/INSTALL.md)
- [Examples](../../docs/skill/EXAMPLES.md)
- [Integrations](../../docs/skill/INTEGRATIONS.md)
