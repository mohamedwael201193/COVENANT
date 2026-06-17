# COVENANT Deployment Guide

Deploy COVENANT to Pharos Atlantic Testnet with Render (recommended) or Vercel (dashboard only).

## Prerequisites

- Node.js ≥ 20, pnpm 9.x
- GitHub repository with this monorepo
- Pharos Atlantic testnet wallet funded with PHRS
- GoPlus API credentials ([console.gopluslabs.io](https://console.gopluslabs.io))
- At least one LLM API key (Cerebras, SambaNova, Together, OpenRouter, Groq, or Gemini)
- Supabase Postgres `DATABASE_URL` (indexer)
- Upstash Redis `REDIS_URL` (indexer BullMQ)

## Contract Addresses (Pharos Atlantic)

Chain ID: **688689** · Explorer: [atlantic.pharosscan.xyz](https://atlantic.pharosscan.xyz)

| Contract | Address |
|---|---|
| IdentityRegistry | `0x05545F026b75f03aE9Cf1eA8a8373473c94ed323` |
| CovenantRegistry | `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770` |
| DecisionLog | `0x8A80D270dd7028536ecB6f92b04eec11F929d603` |
| ReputationRegistry | `0x92b8815A17D85E45DB5Da9952764Ee2ce072A973` |
| GuardedExecutor | `0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F` |

**Attester / Oracle signer:** `0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3`

These defaults are baked into `packages/shared/src/chains.ts` and `render.yaml`. Override via env vars if redeploying.

## Local Setup

```bash
pnpm install
pnpm generate:abis
cp .env.example .env   # fill all required values
pnpm test:contracts && pnpm test && pnpm build

pnpm dev:skill    # :8787
pnpm dev:indexer  # :8788 (requires DATABASE_URL + REDIS_URL)
pnpm dev:web      # :5173
```

Run indexer migrations locally:

```bash
pnpm --filter @covenant/indexer db:migrate
```

## GitHub Push

1. Commit and push to your GitHub repository.
2. Ensure `pnpm-lock.yaml` is committed.
3. CI (`.github/workflows/ci.yml`) runs build, Foundry tests, and Vitest on push.

Render connects directly to GitHub — no manual artifact upload required.

## Render Blueprint (`render.yaml`)

The repo includes a [Render Blueprint](../render.yaml) defining three web services and one Postgres database.

| Service | Type | Port | Health |
|---|---|---|---|
| `covenant-skill` | Node web | 8787 (via `PORT`) | `/health` |
| `covenant-indexer` | Node web | 8788 (via `PORT`) | `/health` |
| `covenant-web` | Static site | — | — |
| `covenant-db` | Postgres | — | — |

### Step-by-Step Render Deploy

1. **Connect repo** — [Render Dashboard](https://dashboard.render.com) → New → Blueprint → select your GitHub repo.
2. **Review services** — Render reads `render.yaml` and creates skill, indexer, web, and database.
3. **Set secret env vars** (sync: false in blueprint):

   | Variable | Service | Required |
   |---|---|---|
   | `PHAROS_RPC_URL` | skill, indexer | Yes |
   | `DEPLOYER_PRIVATE_KEY` | skill, indexer | Yes (must match on-chain attester) |
   | `GOPLUS_APP_KEY` | skill | Yes |
   | `GOPLUS_APP_SECRET` | skill | Yes |
   | `CEREBRAS_API_KEY` or other LLM key | skill | At least one |
   | `REDIS_URL` | indexer | Yes |
   | `VITE_API_URL` | web | Yes (skill hostname) |
   | `VITE_HEALTH_URL` | web | Recommended (skill hostname) |
   | `PINATA_JWT` | skill | Optional |

   `DATABASE_URL` is auto-wired from `covenant-db`.

4. **Deploy** — Render runs build commands, indexer runs `prisma migrate deploy` via `preDeployCommand`.
5. **Verify** — curl skill and indexer health endpoints (see [OPERATIONS.md](./OPERATIONS.md)).
6. **Fund attester** — ensure `DEPLOYER_PRIVATE_KEY` address has PHRS on Pharos Atlantic.

### Render Build Commands (from blueprint)

**Skill:**
```bash
corepack enable && pnpm install --frozen-lockfile && pnpm generate:abis &&
pnpm --filter covenant-shared build && pnpm --filter covenant-skill build
```

**Indexer:**
```bash
corepack enable && pnpm install --frozen-lockfile && pnpm generate:abis &&
pnpm --filter covenant-shared build && pnpm --filter @covenant/indexer build
# preDeploy: cd packages/indexer && npx prisma migrate deploy
```

**Web:**
```bash
corepack enable && pnpm install --frozen-lockfile &&
node packages/web/scripts/render-build.mjs
```

## Environment Variables Reference

### Skill Server (`packages/skill`)

| Variable | Default | Description |
|---|---|---|
| `PHAROS_CHAIN_ID` | `688689` | Pharos Atlantic chain ID |
| `PHAROS_RPC_URL` | — | Primary RPC URL (required) |
| `PHAROS_RPC_URL_FALLBACK` | `https://atlantic.dplabs-internal.com` | Fallback RPC |
| `PHAROS_EXPLORER_URL` | `https://atlantic.pharosscan.xyz` | Block explorer base |
| `DEPLOYER_PRIVATE_KEY` | — | Attester signer (0x + 64 hex) |
| `GOPLUS_APP_KEY` | — | GoPlus API key |
| `GOPLUS_APP_SECRET` | — | GoPlus API secret |
| `GOPLUS_API_BASE` | `https://api.gopluslabs.io` | GoPlus endpoint |
| `CEREBRAS_API_KEY` | — | LLM provider (optional) |
| `CEREBRAS_MODEL` | `llama3.3-70b` | Cerebras model |
| `SAMBANOVA_API_KEY` | — | LLM provider (optional) |
| `SAMBANOVA_MODEL` | `Meta-Llama-3.3-70B-Instruct` | SambaNova model |
| `TOGETHER_API_KEY` | — | LLM provider (optional) |
| `TOGETHER_MODEL` | `meta-llama/Llama-3.3-70B-Instruct-Turbo-Free` | Together model |
| `OPENROUTER_API_KEY` | — | LLM provider (optional) |
| `OPENROUTER_MODEL` | `meta-llama/llama-3.3-70b-instruct:free` | OpenRouter model |
| `GROQ_API_KEY` | — | LLM provider (optional) |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model |
| `GEMINI_API_KEY` | — | LLM provider (optional) |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model |
| `PINATA_JWT` | — | IPFS uploads (optional) |
| `SKILL_SERVER_PORT` | `8787` | Local dev port |
| `SKILL_SERVER_HOST` | `0.0.0.0` | Bind address |
| `PORT` | — | Render injects this (overrides SKILL_SERVER_PORT) |
| `MCP_STDIO_ENABLED` | `false` on Render | Set `true` for local Cursor MCP |
| `IDENTITY_REGISTRY_ADDRESS` | see contracts table | Override deployed address |
| `COVENANT_REGISTRY_ADDRESS` | see contracts table | Override deployed address |
| `DECISION_LOG_ADDRESS` | see contracts table | Override deployed address |
| `REPUTATION_REGISTRY_ADDRESS` | see contracts table | Override deployed address |
| `GUARDED_EXECUTOR_ADDRESS` | see contracts table | Override deployed address |
| `LOG_LEVEL` | `info` | Pino log level |

### Indexer (`packages/indexer`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | Postgres connection string (required) |
| `REDIS_URL` | — | Redis/Upstash URL (required) |
| `PHAROS_CHAIN_ID` | `688689` | Chain ID |
| `PHAROS_RPC_URL` | — | RPC URL (required) |
| `DEPLOYER_PRIVATE_KEY` | — | Oracle writes (optional if oracle disabled) |
| `INDEXER_START_BLOCK` | `24340730` | First block to index |
| `INDEXER_POLL_INTERVAL_MS` | `12000` | Watcher poll interval |
| `INDEXER_HTTP_PORT` | `8788` | Local dev port |
| `INDEXER_HTTP_HOST` | `0.0.0.0` | Bind address |
| `PORT` | — | Render injects this |
| `INDEXER_ORACLE_ENABLED` | `true` | Enable reputation oracle worker |
| Contract address vars | see contracts table | Same as skill |

### Web (`packages/web`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `/api` | Skill REST base (e.g. `https://covenant-skill.onrender.com/api`) |
| `VITE_HEALTH_URL` | — | Skill health base (e.g. `https://covenant-skill.onrender.com`) |

The Render build script (`packages/web/scripts/render-build.mjs`) prepends `https://` when `VITE_API_URL` is a bare hostname.

### CertiK Scanner (optional)

| Variable | Default | Description |
|---|---|---|
| `CERTIK_SCANNER_URL` | — | Scanner endpoint |
| `CERTIK_SCANNER_API_KEY` | — | API key |
| `CERTIK_SCANNER_ENABLED` | `false` | Enable scan |

**Status:** `WAITING_FOR_OFFICIAL_ACCESS` — adapter at `packages/security/certik/` returns this until credentials are provided.

## Vercel Alternative (Dashboard Only)

Production dashboard: **https://web-eight-eta-26.vercel.app**

Vercel hosts the static React/Vite build only. The skill server must run elsewhere (Render or local).

1. Import `packages/web` or the monorepo root with root directory `packages/web`.
2. Set environment variables in Vercel project settings:

   ```
   VITE_API_URL=https://your-skill-host.onrender.com/api
   VITE_HEALTH_URL=https://your-skill-host.onrender.com
   ```

3. Build command: `pnpm exec vite build` (or use monorepo install from root).
4. Output directory: `dist`.

The dashboard calls skill REST endpoints; it does **not** talk to the indexer directly in the current implementation.

## Contract Deployment (Optional — Already Deployed)

Contracts are already deployed on Pharos Atlantic. To redeploy:

```bash
pnpm deploy:contracts
pnpm verify:contracts   # requires PHAROS_EXPLORER_API_KEY
```

Update env vars and `packages/shared/src/chains.ts` defaults after redeployment.

## Live Demo Transactions

| Step | Tx Hash |
|---|---|
| Deploy IdentityRegistry | [0x96191956…](https://atlantic.pharosscan.xyz/tx/0x96191956ae65e47ceb25a710bd9410a8bc6647e497dff6eed883cf5514be85ec) |
| Register demo agent | [0x53e91cf1…](https://atlantic.pharosscan.xyz/tx/0x53e91cf1a0dace92fc2bbf4601fa09912af522d8e7147e458a7ff62edf7f1756) |
| Set covenant | [0x86a7ed75…](https://atlantic.pharosscan.xyz/tx/0x86a7ed75957452f81dcf95f92fab8116aa7e7da2f36ed9317ca670275728857e) |
| Guarded execution (ALLOW) | [0x1ff0fa3f…](https://atlantic.pharosscan.xyz/tx/0x1ff0fa3f3c0d3957b7e8ee21b9402b5f5051fc428cf3f822eda25c24feba0f8b) |
| Breach attempt | Reverted `CovenantBreach()` (wrong covenant hash) |

## Post-Deploy Checklist

See [submission/DEPLOYMENT_CHECKLIST.md](./submission/DEPLOYMENT_CHECKLIST.md).

## Related Docs

- [Architecture](./ARCHITECTURE.md)
- [Operations](./OPERATIONS.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
