# COVENANT

Production credible-commitment layer for autonomous agents on **Pharos Atlantic Testnet** (chainId `688689`).

See [docs/README.md](docs/README.md) for contract addresses, live demo tx hashes, and quick start.

## Documentation

| Doc | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System diagram, packages, data flow, deterministic safety core |
| [Deployment](docs/DEPLOYMENT.md) | Render blueprint, env vars, step-by-step deploy, Vercel alt |
| [Security](docs/SECURITY.md) | Egress allowlist, non-custodial model, LLM cannot ALLOW |
| [API Reference](docs/API_REFERENCE.md) | REST endpoints — skill `:8787`, indexer `:8788` |
| [MCP Reference](docs/MCP_REFERENCE.md) | All 9 MCP tools with input schemas |
| [Operations](docs/OPERATIONS.md) | Health checks, monitoring, logs, oracle, indexer lag |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | RPC rate limits, Supabase, GoPlus on Pharos, etc. |

### Submission

| Doc | Description |
|---|---|
| [DoraHacks Checklist](docs/submission/DORAHACKS_CHECKLIST.md) | Hackathon submission checklist |
| [Submission Checklist](docs/submission/SUBMISSION_CHECKLIST.md) | General readiness checklist |
| [Deployment Checklist](docs/submission/DEPLOYMENT_CHECKLIST.md) | Post-deploy verification |
| [Judge Testing Guide](docs/submission/JUDGE_TESTING_GUIDE.md) | 15-minute evaluator guide |
| [Demo Guide](docs/submission/DEMO_GUIDE.md) | 90-second demo script |

## Status

| Component | Status |
|---|---|
| Smart contracts (deployed + bytecode verified) | ✅ [Explorer links](docs/README.md) |
| Foundry tests (32) + Vitest (68) | ✅ |
| MCP + REST skill server (Render-ready) | ✅ `render.yaml` + Docker |
| React dashboard (Vite) | ✅ [Vercel](https://web-eight-eta-26.vercel.app) + Render static |
| Redis (Upstash) | ✅ validated |
| Postgres | ✅ Render `covenant-db` in blueprint (or external `DATABASE_URL`) |
| CertiK scanner | ⏳ `WAITING_FOR_OFFICIAL_ACCESS` |
| Explorer source verification | ⚠️ needs `PHAROS_EXPLORER_API_KEY` |

## Render deploy (one-click)

1. Push repo to GitHub
2. [Render Dashboard](https://dashboard.render.com) → **New Blueprint** → select repo
3. Add secret env vars (`DEPLOYER_PRIVATE_KEY`, `PHAROS_RPC_URL`, `REDIS_URL`, LLM keys, GoPlus keys)
4. After `covenant-skill` is live, set on `covenant-web`: `VITE_API_URL=https://<skill-host>/api`
5. Deploy

Full guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Commands

```bash
pnpm install && pnpm generate:abis && pnpm test && pnpm build
pnpm verify:deploy          # on-chain bytecode + attester check
pnpm dev:skill              # MCP + REST :8787
pnpm dev:web                # Dashboard :5173
pnpm dev:indexer            # Indexer :8788
```
