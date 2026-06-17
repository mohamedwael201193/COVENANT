# COVENANT — Full Project Summary

> **Purpose:** Complete record of everything built, deployed, tested, broken, and fixed from project start through production deployment for DoraHacks / Pharos Atlantic Testnet.

---

## 1. Project overview

**COVENANT** is a credible-commitment layer for autonomous AI agents on **Pharos Atlantic Testnet** (chainId `688689`). It merges three concepts into one closed loop:

- **Covenant** — EIP-712 signed policy (caps, allow/deny lists, time windows, tier curves)
- **Trust Capital (NEXUM)** — reputation score that accrues/slashes from attested outcomes
- **Execution Certification (AEGIS)** — simulate → rules → GoPlus → signed ALLOW/WARN/DENY → on-chain `GuardedExecutor`

**GitHub:** https://github.com/mohamedwael201193/COVENANT

---

## 2. What we built (milestones)

| # | Milestone | Status |
|---|-----------|--------|
| M0 | Monorepo skeleton, Foundry, `.env`, git init | ✅ |
| S2 | `packages/shared` — chains, EIP-712, types, ABIs | ✅ |
| S3 | 5 Solidity contracts + Foundry tests (32 tests) | ✅ |
| S4 | Deploy + verify contracts on Pharos Atlantic | ✅ |
| S5–S7 | Chain layer, preflight engine, GuardedExecutor e2e | ✅ |
| S8–S10 | GoPlus, LLM explainer, indexer, MCP tools (9 tools) | ✅ |
| S11 | React/Vite dashboard (real on-chain data) | ✅ |
| S12–S13 | CertiK adapter (stub), docs, live demo txs | ✅ |
| Deploy | Render backend + Vercel frontend + Supabase + Upstash | ✅ |

---

## 3. Live deployment links

| Service | URL | Role |
|---------|-----|------|
| **Backend (skill + indexer)** | https://covenant-skill.onrender.com | REST API, health, MCP-capable skill server |
| **Health check** | https://covenant-skill.onrender.com/health | Attester + RPC probe |
| **Dashboard (Vercel)** | https://covenant-web-mu.vercel.app | React UI |
| **GitHub repo** | https://github.com/mohamedwael201193/COVENANT | Source code |
| **Render dashboard** | https://dashboard.render.com | Backend hosting |
| **Vercel dashboard** | https://vercel.com | Frontend hosting |
| **Supabase** | https://supabase.com/dashboard | Postgres database |
| **Upstash** | https://console.upstash.com | Redis (BullMQ queues) |
| **Pharos explorer** | https://atlantic.pharosscan.xyz | Contract verification |

---

## 4. Deployed smart contracts (Pharos Atlantic, chainId 688689)

| Contract | Address | Explorer |
|----------|---------|----------|
| IdentityRegistry | `0x05545F026b75f03aE9Cf1eA8a8373473c94ed323` | [View](https://atlantic.pharosscan.xyz/address/0x05545F026b75f03aE9Cf1eA8a8373473c94ed323) |
| CovenantRegistry | `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770` | [View](https://atlantic.pharosscan.xyz/address/0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770) |
| DecisionLog | `0x8A80D270dd7028536ecB6f92b04eec11F929d603` | [View](https://atlantic.pharosscan.xyz/address/0x8A80D270dd7028536ecB6f92b04eec11F929d603) |
| ReputationRegistry | `0x92b8815A17D85E45DB5Da9952764Ee2ce072A973` | [View](https://atlantic.pharosscan.xyz/address/0x92b8815A17D85E45DB5Da9952764Ee2ce072A973) |
| GuardedExecutor | `0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F` | [View](https://atlantic.pharosscan.xyz/address/0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F) |
| Attester (oracle signer) | `0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3` | Deployer wallet address |

---

## 5. Architecture — how everything works

```
┌─────────────────────────────────────────────────────────────────┐
│  React Dashboard (Vercel)                                       │
│  covenant-web-mu.vercel.app                                     │
│  → fetch /health, /api/* from Render                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│  Render Web Service: covenant-skill                               │
│  scripts/render-start-backend.sh                                │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐ │
│  │ Skill server :10000 │  │ Indexer :8788 (internal)        │ │
│  │ REST + MCP + health │  │ Watcher → BullMQ → Postgres     │ │
│  │ Preflight engine    │  │ Redis job queues                │ │
│  └──────────┬──────────┘  └──────────────┬──────────────────┘ │
└─────────────┼─────────────────────────────┼────────────────────┘
              │ JSON-RPC                    │ eth_getLogs (chunked)
┌─────────────▼─────────────────────────────▼────────────────────┐
│  Pharos Atlantic Testnet (chainId 688689)                        │
│  IdentityRegistry · CovenantRegistry · DecisionLog ·             │
│  ReputationRegistry · GuardedExecutor                            │
└──────────────────────────────────────────────────────────────────┘
              │
┌─────────────▼────────────────────────────────────────────────────┐
│  External services                                               │
│  · Supabase Postgres (indexer projections, agent/covenant cache) │
│  · Upstash Redis (BullMQ: ingest, score, cache-warm queues)      │
│  · GoPlus API (contract/counterparty risk signals)               │
│  · LLM providers (explain-only, never authorizes ALLOW)          │
│  · Pinata IPFS (covenant metadata URIs)                          │
└──────────────────────────────────────────────────────────────────┘
```

### Request flow (preflight / guarded execution)

1. Agent submits an **intent** (target, calldata, value, nonce).
2. **Skill server** runs preflight:
   - Load covenant from `CovenantRegistry`
   - Simulate via `eth_call` + `eth_estimateGas`
   - Run deterministic rules engine
   - Query GoPlus for risk signals
   - Optionally call LLM for human-readable explanation (never changes verdict)
3. Skill signs **EIP-712 attestation** (ALLOW / WARN / DENY).
4. Verdict logged to **DecisionLog** on-chain.
5. If ALLOW, agent calls **GuardedExecutor** with attestation — contract reverts on breach.

### Indexer flow

1. **Watcher** polls Pharos blocks from `INDEXER_START_BLOCK` (chunked `eth_getLogs`, max 999 blocks per request).
2. New logs enqueued to **BullMQ** (`covenant-ingest`, `covenant-score` queues).
3. **Workers** project events into **Supabase Postgres** (agents, covenants, decisions, reputation).
4. Optional oracle writes updated reputation scores on-chain.

### Dashboard flow

1. Browser loads Vercel static app.
2. `VITE_API_URL` → `https://covenant-skill.onrender.com/api`
3. `VITE_HEALTH_URL` → `https://covenant-skill.onrender.com`
4. React Query fetches `/health`, `/api/agents`, `/api/covenants`, `/api/decisions`, `/api/reputation`.
5. Decisions page opens SSE stream at `/api/events/decisions`.

---

## 6. Monorepo structure

```
COVENANT/
├── packages/
│   ├── contracts/     Foundry — 5 Solidity contracts + tests
│   ├── shared/        Chain config, ABIs, EIP-712 types
│   ├── skill/         MCP + REST server, preflight engine, attestation
│   ├── indexer/       Block watcher, BullMQ workers, Prisma/Postgres
│   ├── web/           React/Vite dashboard
│   └── security/      CertiK adapter (optional)
├── scripts/
│   ├── render-start-backend.sh   Combined Render start script
│   ├── smoke-production.ts       Production smoke test
│   └── verify-deploy.ts          On-chain verification
├── render.yaml                   Render Blueprint (reference)
└── .env                          Local secrets (never commit)
```

---

## 7. How we deployed

### 7.1 Smart contracts (one-time)

```bash
pnpm install
pnpm --filter @covenant/contracts deploy    # Foundry script → Pharos Atlantic
pnpm verify:deploy                          # Bytecode + attester check
```

Contract addresses were copied into `.env` and Render/Vercel env vars.

### 7.2 Database (Supabase Postgres)

1. Create project at https://supabase.com
2. Use **Session pooler** connection string (IPv4-compatible), not direct `db.*.supabase.co` (IPv6-only from some hosts).
3. Region used: **eu-west-3**
4. Run migration:

```bash
cd packages/indexer && npx prisma migrate deploy
```

Migration applied: `20250616000000_init` (9 tables).

Validate:

```bash
pnpm --filter @covenant/indexer exec tsx scripts/validate-db.ts
```

### 7.3 Redis (Upstash)

1. Create Redis database at https://console.upstash.com
2. Copy `rediss://` URL (TLS required)
3. Validate:

```bash
pnpm --filter @covenant/indexer exec tsx scripts/validate-redis.ts
```

### 7.4 Backend (Render — manual Web Service)

> **Note:** Render Blueprint (`render.yaml`) was kept as reference but **manual Web Service** was used because Blueprint failed on free tier (see Section 8).

**Render service settings:**

| Setting | Value |
|---------|-------|
| Name | `covenant-skill` |
| Runtime | Node |
| Plan | Free |
| Build command | `corepack enable && pnpm install --frozen-lockfile && pnpm generate:abis && pnpm --filter @covenant/shared build && pnpm --filter @covenant/skill build && pnpm --filter @covenant/indexer build` |
| Start command | `bash scripts/render-start-backend.sh` |
| Health check path | `/health` |

**All env vars from Section 10** must be set in Render dashboard (Environment tab).

### 7.5 Frontend (Vercel)

**Vercel project settings:**

| Setting | Value |
|---------|-------|
| Root directory | `packages/web` |
| Build command | `pnpm exec vite build` |
| Output directory | `dist` |

**Environment variables (Vercel):**

```
VITE_API_URL=https://covenant-skill.onrender.com/api
VITE_HEALTH_URL=https://covenant-skill.onrender.com
```

Also committed in `packages/web/.env.production` for automatic builds.

**SPA routing:** `packages/web/vercel.json` rewrites all routes to `index.html` so `/decisions`, `/covenants`, etc. work on refresh.

---

## 8. Deployment failures and how we fixed them

### 8.1 CI / build failures

| Error | Cause | Fix |
|-------|-------|-----|
| ABI generation failed on Render | No Foundry installed on Render | Skip `forge build` when committed ABIs exist (`generate-abis.mjs`) |
| Typecheck failed — missing Prisma client | CI ran typecheck before `prisma generate` | Generate Prisma client before typecheck in CI |
| Typecheck failed — missing shared types | `@covenant/shared` not built | Build shared package before typecheck |
| Foundry artifacts missing in CI | ABI gen ran before contract compile | Run Foundry build before ABI generation |

### 8.2 Render Blueprint failures (free tier)

| Error | Cause | Fix |
|-------|-------|-----|
| `preDeployCommand` not allowed | Free tier restriction | Move `prisma migrate deploy` to start script |
| Invalid `plan: free` on static site | Blueprint schema issue | Remove web service from Blueprint; deploy dashboard on Vercel only |
| Two free web services limit | Blueprint tried skill + web + indexer | **Combine skill + indexer into one service** |
| Blueprint still failing | Various free-tier limits | **Abandon Blueprint; create manual Web Service** |

### 8.3 Runtime failures on Render

| Error | Cause | Fix |
|-------|-------|-----|
| `EADDRINUSE` port conflict | Render sets `PORT=10000`; indexer grabbed it too | `INDEXER_HTTP_PORT=8788` takes priority; `unset PORT` in indexer subshell |
| `Custom Id cannot contain :` (BullMQ) | Job IDs like `0xabc:3` and `warm:0x...` | Changed to `0xabc-3` and `warm-0x...` |
| Queue name `covenant:ingest` rejected | BullMQ forbids `:` in queue names | Renamed to `covenant-ingest`, `covenant-score` |
| BigInt serialization in BullMQ jobs | JSON cannot serialize BigInt | `toStoredPayload()` / `fromStoredPayload()` helpers |
| `eth_getLogs` block range too large | RPC limit on Pharos | Chunked to 999 blocks with 100ms delay between chunks |
| `cu limit exceeded; request too fast` (ZAN RPC) | Skill + indexer + dashboard hammering ZAN API | RPC fallback transport; swap primary/fallback at startup; disable duplicate skill watcher; cap verdict stats scan to 100; 30s poll interval; 80ms delay between reads |
| TypeScript build fail in queue workers | Unused import + wrong type in `agentFromEvent` | Fixed in commit `8b1a5c3` |
| Intermittent 502 on Render | `wait -n` exited when indexer died, killing skill | Skill runs **foreground** (`exec`); indexer runs background sidecar |
| Dashboard "Failed to fetch" | `VITE_API_URL` missing on Vercel; API calls went to `vercel.app/api` | Added `.env.production` + API URL derived from `VITE_HEALTH_URL` fallback |
| `/decisions` direct URL → 404 | No SPA rewrites on Vercel | Added `packages/web/vercel.json` |
| Supabase direct URL connection failed | Direct host is IPv6-only | Use **Session pooler** URL (`aws-0-<region>.pooler.supabase.com:5432`) |

---

## 9. All tests

### 9.1 Smart contract tests (Foundry)

```bash
pnpm test:contracts
# 32 tests — IdentityRegistry, CovenantRegistry, DecisionLog, ReputationRegistry, GuardedExecutor
```

### 9.2 Unit tests (Vitest)

```bash
pnpm test
```

| Package | Tests | Notes |
|---------|-------|-------|
| `@covenant/indexer` | 6 passed, 1 skipped | Queue job IDs, scoring oracle |
| `@covenant/web` | 4 passed | Utils, API defaults |
| `@covenant/skill` | Engine, schema tests | Preflight logic |
| `@covenant/shared` | EIP-712, chain config | |

### 9.3 Validation scripts

```bash
pnpm validate:env                              # Skill env + contracts + LLM providers
pnpm --filter @covenant/indexer exec tsx scripts/validate-db.ts
pnpm --filter @covenant/indexer exec tsx scripts/validate-redis.ts
pnpm --filter @covenant/skill exec tsx scripts/validate-goplus.ts
pnpm --filter @covenant/skill exec tsx scripts/validate-llm.ts
```

### 9.4 On-chain verification

```bash
pnpm verify:deploy
```

Checks: chainId 688689, bytecode at all 5 contracts, attester address match.

### 9.5 Production smoke test

```bash
pnpm smoke:production
```

Tests against live URLs (8 checks):

| # | Check | Endpoint |
|---|-------|----------|
| 1 | Health | `GET /health` |
| 2 | Agents | `GET /api/agents` |
| 3 | Covenants | `GET /api/covenants` |
| 4 | Decisions | `GET /api/decisions?limit=5` |
| 5 | Reputation | `GET /api/reputation` |
| 6 | SSE stream | `GET /api/events/decisions` |
| 7 | CORS | OPTIONS from Vercel origin |
| 8 | Dashboard | Vercel site loads |

**Last result:** 8/8 passed.

### 9.6 Live demo

```bash
pnpm demo:live
```

Runs end-to-end preflight + on-chain decision logging on Pharos testnet.

---

## 10. Environment variables (names only — no real values)

### 10.1 Pharos / chain

| Variable | Required | How to get it |
|----------|----------|---------------|
| `PHAROS_CHAIN_ID` | Yes | `688689` for Atlantic Testnet — confirm at https://docs.pharos.xyz |
| `PHAROS_RPC_URL` | Yes | Pharos dashboard or ZAN node URL — https://testnet.pharosnetwork.xyz |
| `PHAROS_RPC_URL_FALLBACK` | Recommended | Public fallback: `https://atlantic.dplabs-internal.com` |
| `PHAROS_WSS_URL` | No | WebSocket RPC if available |
| `PHAROS_EXPLORER_URL` | No | Default: `https://atlantic.pharosscan.xyz` |
| `PHAROS_EXPLORER_API_KEY` | No | PharosScan API for contract source verification |

### 10.2 Signer / contracts

| Variable | Required | How to get it |
|----------|----------|---------------|
| `DEPLOYER_PRIVATE_KEY` | Yes | Your testnet wallet private key (never use mainnet funds) |
| `IDENTITY_REGISTRY_ADDRESS` | After deploy | Output of `pnpm deploy:contracts` |
| `COVENANT_REGISTRY_ADDRESS` | After deploy | Output of deploy script |
| `DECISION_LOG_ADDRESS` | After deploy | Output of deploy script |
| `REPUTATION_REGISTRY_ADDRESS` | After deploy | Output of deploy script |
| `GUARDED_EXECUTOR_ADDRESS` | After deploy | Output of deploy script |
| `ATTESTER_ADDRESS` | Optional | Usually same as deployer wallet address |

### 10.3 GoPlus security API

| Variable | Required | How to get it |
|----------|----------|---------------|
| `GOPLUS_APP_KEY` | Yes | https://console.gopluslabs.io → create app |
| `GOPLUS_APP_SECRET` | Yes | Same console |
| `GOPLUS_API_BASE` | No | Default: `https://api.gopluslabs.io` |

### 10.4 LLM providers (explain-only, priority order)

At least one recommended. All optional individually; skill tries in order:

| Variable | How to get it |
|----------|---------------|
| `CEREBRAS_API_KEY` + `CEREBRAS_MODEL` | https://cloud.cerebras.ai |
| `SAMBANOVA_API_KEY` + `SAMBANOVA_MODEL` | https://cloud.sambanova.ai |
| `TOGETHER_API_KEY` + `TOGETHER_MODEL` | https://api.together.xyz |
| `OPENROUTER_API_KEY` + `OPENROUTER_MODEL` | https://openrouter.ai |
| `GROQ_API_KEY` + `GROQ_MODEL` | https://console.groq.com |
| `GEMINI_API_KEY` + `GEMINI_MODEL` | https://aistudio.google.com |

### 10.5 IPFS

| Variable | Required | How to get it |
|----------|----------|---------------|
| `PINATA_JWT` | Optional | https://pinata.cloud → API keys → JWT |

### 10.6 Database and cache

| Variable | Required | How to get it |
|----------|----------|---------------|
| `DATABASE_URL` | Yes (indexer) | Supabase → Project Settings → Database → **Session pooler** URI (`postgresql://postgres.<ref>:...@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require`) |
| `REDIS_URL` | Yes (indexer) | Upstash → Redis database → `rediss://` connection string |

### 10.7 Skill server

| Variable | Required | How to get it |
|----------|----------|---------------|
| `SKILL_SERVER_PORT` | Local only | Default `8787` |
| `SKILL_SERVER_HOST` | No | Default `0.0.0.0` |
| `PORT` | Render sets this | Render injects automatically (e.g. `10000`) |
| `MCP_STDIO_ENABLED` | No | `true` for local Cursor MCP; `false` on Render |
| `SKILL_DECISION_WATCHER_ENABLED` | No | `false` on Render (indexer handles events); default `true` locally |

### 10.8 Indexer

| Variable | Required | How to get it |
|----------|----------|---------------|
| `INDEXER_START_BLOCK` | Yes | Block number of contract deployment (e.g. `24340730`) |
| `INDEXER_POLL_INTERVAL_MS` | No | Default `12000`; use `30000` on Render free tier |
| `INDEXER_HTTP_PORT` | Combined deploy | `8788` (internal, set in start script) |
| `INDEXER_HTTP_HOST` | No | Default `0.0.0.0` |
| `INDEXER_ORACLE_ENABLED` | No | `true` to write reputation scores on-chain |

### 10.9 Web dashboard (Vercel)

| Variable | Required | How to get it |
|----------|----------|---------------|
| `VITE_API_URL` | Yes | `https://<your-render-service>.onrender.com/api` |
| `VITE_HEALTH_URL` | Yes | `https://<your-render-service>.onrender.com` |

### 10.10 Optional / disabled

| Variable | Default | Notes |
|----------|---------|-------|
| `CERTIK_SCANNER_URL` | empty | Waiting for official CertiK access |
| `CERTIK_SCANNER_API_KEY` | empty | Same |
| `CERTIK_SCANNER_ENABLED` | `false` | |
| `X402_ENABLED` | `false` | Pharos EIP-3009 USDC unconfirmed |

---

## 11. REST API endpoints (skill server)

Base URL: `https://covenant-skill.onrender.com`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | RPC probe + attester balance |
| GET | `/api/agents` | Registered agents |
| GET | `/api/covenants` | Active covenants |
| POST | `/api/covenants` | Create/set covenant |
| GET | `/api/decisions?limit=N` | Decision feed + stats |
| GET | `/api/reputation` | All agents with scores |
| GET | `/api/reputation/:agent` | Single agent reputation |
| POST | `/api/preflight` | Run preflight check |
| POST | `/api/simulate` | Simulate intent |
| GET | `/api/receipt/:id` | Decision receipt by ID |
| GET | `/api/events/decisions` | SSE live decision stream |

Indexer also exposes similar routes on internal port `8788` (not public on Render).

---

## 12. MCP tools (local Cursor use)

Set `MCP_STDIO_ENABLED=true` locally. Nine tools exposed:

- `covenant_preflight` — full preflight pipeline
- `covenant_simulate` — eth_call simulation
- `covenant_set_covenant` — register covenant on-chain
- `covenant_get_covenant` — read covenant
- `covenant_list_agents` — list agents
- `covenant_get_reputation` — read reputation
- `covenant_get_decision` — read decision receipt
- `covenant_explain` — LLM explanation of verdict
- `covenant_health` — server health

---

## 13. Git commit history (deployment-related)

```
7b0f5d6 fix(web): SPA rewrites for Vercel client routes
9899158 fix(web): point Vercel dashboard at Render API and stabilize start script
bdb983c fix(deploy): BullMQ job IDs without colons and reduce RPC load
8b1a5c3 fix(indexer): resolve TypeScript build errors in queue workers
c00c80c fix: BullMQ BigInt serialization, RPC fallback, resilient health
7e402fb fix(render): port conflict, chunked eth_getLogs, RPC fallback
81fa17e fix(indexer): BullMQ queue names cannot contain colons
6b0f45b fix(render): single free service — skill + indexer combined
0c613b7 fix(render): migrate on start, skip forge on deploy, resilient ABI generation
a627d71 fix(render): remove web service — dashboard deploys on Vercel only
5752d0b fix(render): free-tier deploy — move prisma migrate to buildCommand
9249bb0 COVENANT Phase 1 — production submission package
```

---

## 14. Quick start (local development)

```bash
# 1. Clone and install
git clone https://github.com/mohamedwael201193/COVENANT.git
cd COVENANT
pnpm install

# 2. Copy env template and fill in values (see Section 10)
cp .env.example .env   # or create .env manually

# 3. Generate ABIs and build
pnpm generate:abis
pnpm build

# 4. Run database migration (needs DATABASE_URL)
cd packages/indexer && npx prisma migrate deploy && cd ../..

# 5. Start services (3 terminals)
pnpm dev:skill      # :8787 — REST + MCP
pnpm dev:indexer    # :8788 — watcher + workers
pnpm dev:web        # :5173 — dashboard (proxies to :8787)

# 6. Verify
pnpm validate:env
pnpm verify:deploy
pnpm smoke:production   # against production URLs
open http://localhost:5173
```

---

## 15. Known limitations

| Item | Status |
|------|--------|
| Render free tier cold start | First request after ~15 min idle may take 30–60s |
| ZAN RPC rate limits | Use dplabs fallback as primary; increase poll interval |
| CertiK scanner | Not configured — waiting for official access |
| Explorer source verification | Needs `PHAROS_EXPLORER_API_KEY` |
| x402 payments | Disabled — Pharos EIP-3009 USDC not confirmed |
| SSE on production | Stream opens but new events require indexer → skill bridge (skill watcher disabled on Render) |
| GoPlus on Pharos | Partial chain coverage — treated as downgrade-only signal |

---

## 16. Submission checklist for judges

- [x] Contracts deployed and bytecode verified on Pharos Atlantic
- [x] Backend live at https://covenant-skill.onrender.com/health
- [x] Dashboard live at https://covenant-web-mu.vercel.app
- [x] At least 1 on-chain decision logged
- [x] Attester health shows MATCH + balance
- [x] Production smoke test 8/8
- [x] GitHub repo public
- [ ] CertiK scan (optional — pending access)
- [ ] Explorer source verification (optional — needs API key)

**Judge quick test:**

```bash
curl https://covenant-skill.onrender.com/health
curl https://covenant-skill.onrender.com/api/decisions?limit=5
open https://covenant-web-mu.vercel.app
```

---

*Last updated: June 2026 — reflects production state after commits through `7b0f5d6`.*
