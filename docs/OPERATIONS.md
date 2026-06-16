# COVENANT Operations

Runbook for health checks, monitoring, logs, restarts, oracle, and indexer lag.

## Service Ports

| Service | Default port | Env override |
|---|---|---|
| Skill (REST + MCP) | 8787 | `PORT`, `SKILL_SERVER_PORT` |
| Indexer (REST + workers) | 8788 | `PORT`, `INDEXER_HTTP_PORT` |
| Web (Vite dev) | 5173 | — |

On Render, `PORT` is injected automatically.

## Health Checks

### Skill server

```bash
curl -s http://localhost:8787/health | jq
curl -s http://localhost:8787/health/live
```

| Field | Healthy | Action if unhealthy |
|---|---|---|
| `status` | `"ok"` | Investigate attester/RPC |
| `attester.match` | `true` | Set `DEPLOYER_PRIVATE_KEY` to on-chain attester key |
| `attester.balanceWei` | `> 0` | Fund attester wallet on Pharos Atlantic |
| `rpc.ethCall` | `true` | Check RPC URL / rate limits |
| `rpc.blockNumber` | advancing | RPC may be stalled |

Render uses `healthCheckPath: /health` — returns 503 when degraded.

### Indexer

```bash
curl -s http://localhost:8788/health | jq
```

| Field | Healthy | Action if unhealthy |
|---|---|---|
| `status` | `"ok"` | Check db + redis |
| `db` | `true` | Verify `DATABASE_URL`, run migrations |
| `redis` | `true` | Verify `REDIS_URL` (Upstash TLS: `rediss://`) |
| `lag` | `< 50` blocks | Normal catch-up; see lag section |

### Dashboard

```bash
curl -s "${VITE_HEALTH_URL:-http://localhost:8787}/health"
```

Production: https://web-eight-eta-26.vercel.app (requires skill server reachable).

## Monitoring

### What to watch

1. **Skill `/health`** — attester funded + RPC alive (Render auto-restarts on failure)
2. **Indexer `/health`** — `lag` field vs chain head
3. **Decision SSE** — `GET /api/events/decisions` for live feed
4. **On-chain** — new entries in [DecisionLog](https://atlantic.pharosscan.xyz/address/0x8A80D270dd7028536ecB6f92b04eec11F929d603)

### Log format

Both services use **Pino** structured JSON logs.

```bash
# Local with pretty output (if configured)
LOG_LEVEL=debug pnpm dev:skill
LOG_LEVEL=debug pnpm dev:indexer
```

Key log events:

| Logger | Event | Meaning |
|---|---|---|
| `covenant-skill` | `REST server listening` | Skill boot OK |
| `covenant-skill` | `RPC capability probe complete` | RPC methods detected |
| `covenant-skill` | `Attester health check` | Attester address/balance |
| `covenant-skill` | `tool call failed` | MCP/REST tool error |
| `covenant-indexer` | `indexer started` | Indexer boot OK |
| `covenant-indexer` | `shutting down` | Graceful SIGTERM |

On Render: Dashboard → Service → Logs tab.

## Restart Procedures

### Local

```bash
# Ctrl+C then restart
pnpm dev:skill
pnpm dev:indexer
pnpm dev:web
```

### Render

1. Dashboard → select service → **Manual Deploy** → Deploy latest commit
2. Or **Restart** from the service menu (no rebuild)
3. Indexer restart re-runs watcher from last persisted block in `indexer_state`

### Graceful shutdown

Both services handle `SIGINT` / `SIGTERM`:

- Skill: stops decision watcher, closes HTTP server
- Indexer: stops watcher, closes workers/queues, disconnects Prisma

## Oracle (Trust Capital Scoring)

The indexer oracle (`packages/indexer/src/scoring/oracle.ts`) runs when `INDEXER_ORACLE_ENABLED=true`.

### Score deltas (deterministic)

| Verdict | Delta |
|---|---|
| ALLOW | +10 |
| WARN | +2 |
| DENY | +5 |
| Breach slash | −25 |

### Tier thresholds

| Min score | Tier |
|---|---|
| 1000 | PLATINUM (4) |
| 500 | GOLD (3) |
| 200 | SILVER (2) |
| 50 | BRONZE (1) |
| 0 | UNTRUSTED (0) |

The oracle worker proposes scores after indexing decisions. On-chain writes use the skill `attestOutcome` tool or indexer worker with `DEPLOYER_PRIVATE_KEY`.

Manual attestation via MCP:

```json
{
  "agent": "0x...",
  "score": "110",
  "tier": 1,
  "decisionIds": ["0"]
}
```

## Indexer Lag

### Understanding lag

```
lag = chainHead - lastIndexedBlock
```

Reported in `GET /health` on port 8788.

### Normal lag

- **0–20 blocks** — healthy
- **20–100 blocks** — catching up after restart or RPC slowdown
- **> 100 blocks** — investigate

### Causes and fixes

| Cause | Fix |
|---|---|
| Indexer just restarted | Wait for catch-up (poll interval 12s default) |
| RPC rate limiting | Switch RPC URL or add fallback |
| Redis/DB slow | Check Upstash/Supabase status |
| Watcher stuck | Restart indexer; check logs for parse errors |
| Wrong `INDEXER_START_BLOCK` | Set to deployment block `24340730` |

### Rebuild from genesis

```bash
pnpm --filter @covenant/indexer db:migrate
# Truncate projection tables if needed, reset indexer_state
pnpm dev:indexer
```

Tests verify projection rebuild: `packages/indexer/test/rebuild-projection.test.ts`.

## Database Migrations

```bash
# Development
pnpm --filter @covenant/indexer db:migrate

# Production (Render preDeploy)
cd packages/indexer && npx prisma migrate deploy
```

Schema: `packages/indexer/prisma/schema.prisma`

## MCP Local Operations

Enable stdio MCP for Cursor:

```bash
MCP_STDIO_ENABLED=true pnpm dev:skill
```

Or build + run:

```bash
pnpm --filter @covenant/skill build
MCP_STDIO_ENABLED=true node packages/skill/dist/index.js
```

## Related Docs

- [Deployment](./DEPLOYMENT.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [API Reference](./API_REFERENCE.md)
