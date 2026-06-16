# Deployment Checklist

Step-by-step verification after deploying COVENANT to Render + Vercel.

## Pre-Deploy

- [ ] GitHub repo pushed with latest commit
- [ ] `.env.example` documents all variables
- [ ] Local smoke test passes:
  ```bash
  pnpm install && pnpm generate:abis && pnpm test && pnpm build
  ```

## Secrets Prepared

- [ ] `PHAROS_RPC_URL` — working Atlantic endpoint
- [ ] `DEPLOYER_PRIVATE_KEY` — matches attester `0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3`
- [ ] Attester wallet funded with PHRS
- [ ] `GOPLUS_APP_KEY` + `GOPLUS_APP_SECRET`
- [ ] At least one LLM API key
- [ ] `REDIS_URL` — Upstash `rediss://` URL
- [ ] Supabase `DATABASE_URL` (auto from Render DB if using blueprint)

## Render Blueprint

- [ ] Connect GitHub repo to Render
- [ ] Blueprint creates 4 resources: skill, indexer, web, covenant-db
- [ ] Set sync:false secrets in Render dashboard
- [ ] `MCP_STDIO_ENABLED=false` on skill (Render default from blueprint)
- [ ] `INDEXER_START_BLOCK=24340730`
- [ ] Contract addresses set in blueprint (or use defaults from shared)

## Post-Deploy Verification

### Skill service

- [ ] Build succeeded (check Render logs)
- [ ] Service status: Live
- [ ] Health check passing:
  ```bash
  curl https://YOUR-SKILL.onrender.com/health
  ```
- [ ] Response shows:
  - [ ] `"status": "ok"`
  - [ ] `"attester": { "match": true }`
  - [ ] `"attester": { "balanceWei": ">0" }`
  - [ ] `"rpc": { "chainId": 688689 }`

### Indexer service

- [ ] Build succeeded
- [ ] `preDeployCommand` ran `prisma migrate deploy` successfully
- [ ] Health check passing:
  ```bash
  curl https://YOUR-INDEXER.onrender.com/health
  ```
- [ ] Response shows:
  - [ ] `"db": true`
  - [ ] `"redis": true`
  - [ ] `"lag"` decreasing or < 50

### Web (Render static or Vercel)

**Render:**
- [ ] `VITE_API_URL` = skill hostname (build script adds `https://` and `/api`)
- [ ] `VITE_HEALTH_URL` = skill hostname
- [ ] Static site loads

**Vercel (alternative):**
- [ ] Project linked to repo / `packages/web`
- [ ] Env vars set at build time
- [ ] Production URL: https://web-eight-eta-26.vercel.app (or your deployment)
- [ ] Dashboard shows agents/decisions (not empty error state)

## Functional Smoke Test

- [ ] `GET /api/agents` returns JSON
- [ ] `GET /api/decisions?limit=5` returns decisions + stats
- [ ] `POST /api/preflight` with test intent returns verdict
- [ ] Dashboard health indicator green

## On-Chain Verification

- [ ] Contracts visible on PharosScan:
  - [ ] [IdentityRegistry](https://atlantic.pharosscan.xyz/address/0x05545F026b75f03aE9Cf1eA8a8373473c94ed323)
  - [ ] [GuardedExecutor](https://atlantic.pharosscan.xyz/address/0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F)
- [ ] Live demo txs accessible (see [README.md](../README.md))
- [ ] New test execution produces DecisionLog entry

## Monitoring Setup

- [ ] Bookmark skill `/health` and indexer `/health`
- [ ] Render email alerts enabled for deploy failures
- [ ] Log retention accessible in Render dashboard

## Rollback Plan

- [ ] Previous Render deploy available via **Rollback** in dashboard
- [ ] Env var backup saved locally (not in git)
- [ ] Contract addresses unchanged (no redeploy needed for app rollback)

## Known Gaps (document honestly)

- [ ] CertiK: `WAITING_FOR_OFFICIAL_ACCESS`
- [ ] Explorer verification: pending `PHAROS_EXPLORER_API_KEY`
- [ ] GoPlus Pharos token data may return `unknown`

## Sign-Off

| Check | Owner | Date |
|---|---|---|
| Skill health OK | | |
| Indexer lag acceptable | | |
| Dashboard live | | |
| Demo txs verified | | |

## Related Docs

- [DEPLOYMENT.md](../DEPLOYMENT.md)
- [OPERATIONS.md](../OPERATIONS.md)
- [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
