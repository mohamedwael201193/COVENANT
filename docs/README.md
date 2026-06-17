# COVENANT

**The credible-commitment layer for autonomous agents** — binding EIP-712 covenants, pre-flight certification, on-chain guarded execution, and slashable Trust Capital on Pharos Atlantic Testnet.

## Deployed Contracts (Pharos Atlantic, chainId 688689)

| Contract | Address | Explorer |
|---|---|---|
| IdentityRegistry | `0x05545F026b75f03aE9Cf1eA8a8373473c94ed323` | [View](https://atlantic.pharosscan.xyz/address/0x05545F026b75f03aE9Cf1eA8a8373473c94ed323) |
| CovenantRegistry | `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770` | [View](https://atlantic.pharosscan.xyz/address/0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770) |
| DecisionLog | `0x8A80D270dd7028536ecB6f92b04eec11F929d603` | [View](https://atlantic.pharosscan.xyz/address/0x8A80D270dd7028536ecB6f92b04eec11F929d603) |
| ReputationRegistry | `0x92b8815A17D85E45DB5Da9952764Ee2ce072A973` | [View](https://atlantic.pharosscan.xyz/address/0x92b8815A17D85E45DB5Da9952764Ee2ce072A973) |
| GuardedExecutor | `0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F` | [View](https://atlantic.pharosscan.xyz/address/0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F) |

**Attester / Oracle:** `0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3`

## Live Demo Transactions

| Step | Tx Hash |
|---|---|
| Deploy IdentityRegistry | [0x96191956…](https://atlantic.pharosscan.xyz/tx/0x96191956ae65e47ceb25a710bd9410a8bc6647e497dff6eed883cf5514be85ec) |
| Register demo agent | [0x53e91cf1…](https://atlantic.pharosscan.xyz/tx/0x53e91cf1a0dace92fc2bbf4601fa09912af522d8e7147e458a7ff62edf7f1756) |
| Set covenant | [0x86a7ed75…](https://atlantic.pharosscan.xyz/tx/0x86a7ed75957452f81dcf95f92fab8116aa7e7da2f36ed9317ca670275728857e) |
| Guarded execution (ALLOW) | [0x1ff0fa3f…](https://atlantic.pharosscan.xyz/tx/0x1ff0fa3f3c0d3957b7e8ee21b9402b5f5051fc428cf3f822eda25c24feba0f8b) |
| Breach attempt | Reverted `CovenantBreach()` (wrong covenant hash) |

## CertiK Skill Scanner

> **Status:** `WAITING_FOR_OFFICIAL_ACCESS` — adapter at `packages/security/certik/` is configured but scanner URL/API key not yet available from hackathon organizers.

## Architecture

```
IDENTITY → COVENANT → CERTIFICATION (rules + simulation + GoPlus) → GUARDED EXECUTION → DecisionLog → Trust Capital
```

- **Deterministic safety core:** LLM explains only; never authorizes funds
- **MCP Skill:** `covenant-mcp` (stdio) + REST host `packages/skill` `:8787`
- **Indexer:** `packages/indexer` (BullMQ + Postgres projections)
- **Dashboard (demo):** `packages/web`

## Quick Start

```bash
pnpm install
pnpm generate:abis
cp .env.example .env   # fill credentials

pnpm test:contracts
pnpm test
pnpm build

pnpm dev:skill    # MCP + REST :8787
pnpm dev:indexer  # event indexer :8788
pnpm dev:web      # dashboard :5173
```

## Health Check

```bash
curl http://localhost:8787/health
```

**The credible-commitment MCP skill for autonomous agents** — install with `npx covenant-mcp init`. Dashboard is demo-only.

## Agent skill (primary product)

```bash
npx covenant-mcp init
```

| Doc | Description |
|---|---|
| [AGENTS.md](../AGENTS.md) | Agent skill manifest |
| [skill/INSTALL.md](./skill/INSTALL.md) | 5-minute install |
| [skill/EXAMPLES.md](./skill/EXAMPLES.md) | Send-money workflow |
| [packages/mcp/README.md](../packages/mcp/README.md) | `covenant-mcp` package |

## MCP Tools (10)

`covenant_health`, `covenant_reputation`, `covenant_preflight`, `covenant_simulate`, `covenant_verify_counterparty`, `covenant_get_receipt`, `covenant_register_identity`, `covenant_set_covenant`, `covenant_rotate_key`, `covenant_attest_outcome`

Legacy aliases (`preflight`, `reputation`, …) still work.

See [MCP_REFERENCE.md](./MCP_REFERENCE.md) for full schemas.

## Documentation

| Doc | Description |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System diagram, packages, deterministic safety core |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Render, env vars, Vercel, contract addresses |
| [SECURITY.md](./SECURITY.md) | Egress allowlist, non-custodial, threat model |
| [API_REFERENCE.md](./API_REFERENCE.md) | REST endpoints (skill + indexer) |
| [MCP_REFERENCE.md](./MCP_REFERENCE.md) | 10 MCP tools (`covenant_*`) |
| [OPERATIONS.md](./OPERATIONS.md) | Health, monitoring, oracle, indexer lag |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common errors and fixes |

**Submission:** [DORAHACKS_CHECKLIST.md](./submission/DORAHACKS_CHECKLIST.md) · [SUBMISSION_CHECKLIST.md](./submission/SUBMISSION_CHECKLIST.md) · [DEPLOYMENT_CHECKLIST.md](./submission/DEPLOYMENT_CHECKLIST.md) · [JUDGE_TESTING_GUIDE.md](./submission/JUDGE_TESTING_GUIDE.md) · [DEMO_GUIDE.md](./submission/DEMO_GUIDE.md)

## Dashboard (Vercel)

Production build: **https://web-eight-eta-26.vercel.app**

> Requires a publicly reachable skill server. Set `VITE_API_URL` in Vercel to your deployed skill REST base URL (e.g. `https://your-skill-host:8787/api`). Local dev: `pnpm dev:skill` + `pnpm dev:web`.
