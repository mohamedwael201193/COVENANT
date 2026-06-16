# COVENANT Troubleshooting

Common errors and fixes when running COVENANT locally or on Render.

---

## RPC / Pharos

### Symptom: `health` returns 503, RPC errors in logs

**Cause:** Invalid `PHAROS_RPC_URL`, rate limiting, or network outage.

**Fix:**
1. Verify URL in `.env` — default fallback: `https://atlantic.dplabs-internal.com`
2. Primary ZAN RPC: `https://api.zan.top/node/v1/pharos/atlantic/...` (see `packages/shared/src/chains.ts`)
3. Set `PHAROS_RPC_URL_FALLBACK` to a second endpoint
4. Check `rpc.blockNumber` in `/health` — should advance between calls

### Symptom: `429 Too Many Requests` / rate limit

**Cause:** Public RPC throttling, especially during `listAgents` / `listDecisions` (many sequential `readContract` calls).

**Fix:**
- Use a dedicated RPC key if available
- Reduce dashboard polling frequency
- Prefer indexer API (`:8788`) for list queries instead of skill on-chain reads
- Skill indexer adds 150ms sleep between agent reads — large agent counts are slow by design

### Symptom: `debugTraceCall: false`

**Cause:** Pharos public RPC does not expose debug methods.

**Impact:** Simulation uses `eth_call` + `estimateGas` only — not a failure.

**Fix:** None required. Document limitation in security materials.

---

## Attester / Signer

### Symptom: `/health` status `degraded`, `attester.match: false`

**Cause:** `DEPLOYER_PRIVATE_KEY` address ≠ on-chain `GuardedExecutor.attester`.

**Fix:**
1. Expected attester: `0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3`
2. Use the private key for that address, or update on-chain attester (requires contract owner)

### Symptom: Preflight returns ALLOW but execute reverts

**Causes:**
- Attestation deadline expired
- Intent hash mismatch (wrong nonce/value/data/target)
- Covenant hash on-chain differs from preflight input

**Fix:**
1. Re-run preflight with current nonce
2. Verify `covenantHash` matches `CovenantRegistry.covenants(owner, agent)`
3. Submit execute before attestation deadline (default 3600s)

### Symptom: `CovenantBreach()` on execute

**Cause:** Missing or invalid ALLOW attestation — expected for breach demos.

**Fix:** This is correct on-chain behavior. Use matching attestation from preflight.

---

## GoPlus

### Symptom: `risk.status: "unknown"` on Pharos targets

**Cause:** GoPlus does not fully support Pharos Atlantic (chainId `688689`) for token security. Implementation returns `unknown` gracefully (`packages/skill/src/engine/riskRead.goplus.ts`).

**Impact:** `unknown` does **not** downgrade to DENY — only `malicious` → DENY, `warn` → WARN.

**Fix:** Expected on testnet. Address security API may still return data for EOA addresses. Document in submission.

### Symptom: GoPlus HTTP 401/403

**Cause:** Invalid `GOPLUS_APP_KEY` / `GOPLUS_APP_SECRET`.

**Fix:** Regenerate credentials at [console.gopluslabs.io](https://console.gopluslabs.io).

### Symptom: `GOPLUS_MALICIOUS` violation

**Cause:** GoPlus flagged counterparty as malicious.

**Fix:** Use a different target address or remove `"goplus"` from `requiredChecks` in covenant (not recommended for production).

---

## LLM Explainer

### Symptom: `explanation` is generic / rule fallback text

**Cause:** No LLM API key configured, or all providers failed.

**Fix:** Set at least one of: `CEREBRAS_API_KEY`, `SAMBANOVA_API_KEY`, `TOGETHER_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`.

**Note:** Verdict is unaffected — LLM is optional for explanations.

### Symptom: `EgressViolationError` on LLM call

**Cause:** LLM provider host not on allowlist.

**Fix:** Add host to `packages/skill/src/egress.ts` or use a listed provider.

---

## Supabase / Postgres

### Symptom: Indexer boot fails — `Invalid indexer environment: DATABASE_URL`

**Cause:** Missing or empty `DATABASE_URL`.

**Fix:**
```
DATABASE_URL=postgresql://user:password@host:5432/postgres
```

For Supabase: use connection pooling URL, ensure IP allowlist includes Render egress (or allow all for testnet).

### Symptom: `health.db: false`

**Cause:** Database unreachable, wrong credentials, or migrations not applied.

**Fix:**
```bash
pnpm --filter @covenant/indexer db:migrate
# Render: preDeploy runs prisma migrate deploy
```

### Symptom: Build env cannot reach Supabase

**Cause:** CI/build sandbox network restrictions (noted in root README).

**Fix:** Run migrations locally:
```bash
pnpm --filter @covenant/indexer db:migrate
```

---

## Redis / Upstash

### Symptom: `health.redis: false`

**Cause:** Invalid `REDIS_URL` or TLS mismatch.

**Fix:** Upstash requires TLS:
```
REDIS_URL=rediss://default:password@host.upstash.io:6379
```

### Symptom: BullMQ jobs not processing

**Cause:** Redis connection dropped or workers crashed.

**Fix:** Restart indexer service; check Redis memory limits on free tier.

---

## Indexer Lag

### Symptom: `lag` > 100 blocks and not decreasing

**Fix:**
1. Check RPC health
2. Restart indexer
3. Verify `INDEXER_START_BLOCK=24340730`
4. Inspect logs for event parse failures

See [OPERATIONS.md](./OPERATIONS.md#indexer-lag).

---

## Web Dashboard

### Symptom: Dashboard loads but API calls fail / CORS

**Cause:** `VITE_API_URL` not set or skill server down.

**Fix:**
```
VITE_API_URL=https://your-skill.onrender.com/api
VITE_HEALTH_URL=https://your-skill.onrender.com
```

Rebuild after changing env vars (Vite embeds at build time).

### Symptom: SSE decision feed silent

**Cause:** Skill decision watcher only emits in-process events; no historical replay on connect.

**Fix:** Trigger a new on-chain decision. SSE endpoint: `/api/events/decisions`.

---

## CertiK Scanner

### Symptom: Status `WAITING_FOR_OFFICIAL_ACCESS`

**Cause:** CertiK Skill Scanner URL/API key not yet provided by hackathon organizers.

**Fix:** Wait for official access. Adapter at `packages/security/certik/` returns this status by design.

---

## Contract / Env Validation

### Symptom: `Invalid environment configuration` on skill boot

**Cause:** Zod validation failed — usually missing required env var.

**Required for skill:**
- `PHAROS_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`
- `GOPLUS_APP_KEY`
- `GOPLUS_APP_SECRET`

**Fix:** Copy `.env.example` → `.env` and fill values. Run `pnpm validate:env`.

### Symptom: Private key format error

**Fix:** Key must be `0x` + 64 hex characters (66 chars total).

---

## Common Violation Codes (Preflight)

| Code | Meaning |
|---|---|
| `AGENT_MISMATCH` | Intent agent ≠ covenant agent |
| `ALLOWLIST_MISS` | Target not on allowlist |
| `DENYLIST_HIT` | Target on denylist |
| `VALUE_EXCEEDS_CAP` | Value above tier-scaled max |
| `TIME_WINDOW_CLOSED` | Outside allowed UTC hours |
| `COUNTERPARTY_TIER_LOW` | Counterparty below min tier |
| `SIMULATION_REVERT` | eth_call failed |
| `GOPLUS_MALICIOUS` | GoPlus flagged malicious |
| `GOPLUS_WARN` | GoPlus warnings (verdict WARN) |

---

## Getting Help

1. Check `/health` on skill and indexer
2. Review structured logs (`LOG_LEVEL=debug`)
3. Verify live txs in [docs/README.md](./README.md)
4. See [OPERATIONS.md](./OPERATIONS.md) and [DEPLOYMENT.md](./DEPLOYMENT.md)
