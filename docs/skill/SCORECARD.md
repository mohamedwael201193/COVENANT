# COVENANT Skill Scorecard (v0.2.0)

Production hardening assessment after Antigravity validation.

## Competitive scores (1–10)

| Dimension | v0.1 | v0.2 | Target | Notes |
|---|---|---|---|---|
| **Installation** | 8 | 9 | 9 | `npx covenant-mcp init`, zero-secret Cursor config |
| **Discoverability** | 8 | 8 | 9 | 17 tools, rich descriptions; Smithery pending |
| **Performance** | 7 | 8 | 9 | Fast health path; see `BENCHMARK_REPORT.json` |
| **Security** | 7 | 9 | 9 | SIWE verify, session scopes, no keys in agent |
| **Wallet UX** | 4 | 8 | 9 | connect → session → approval URL flow |
| **Agent UX** | 8 | 9 | 9 | Secret-free preflight/simulate/reputation |
| **Documentation** | 7 | 9 | 9 | World-class README + prompt library |
| **Pharos alignment** | 10 | 10 | 10 | Atlantic, GuardedExecutor, Trust Capital |
| **Reusability** | 8 | 9 | 9 | Hosted attestation API fallback |
| **Composability** | 9 | 9 | 10 | Full pipeline without local keys |

**Overall: 8.4 → 8.8 / 10** (target 9.2 after Smithery + hosted MCP SSE)

## vs reference MCP servers

| Server | Install | Auth | Wallet | Covenant v0.2 |
|---|---|---|---|---|
| GitHub MCP | OAuth device | ✅ | N/A | Comparable install; Covenant adds on-chain auth |
| Stripe MCP | API key | ✅ | N/A | Covenant secret-free read tools win for agents |
| Supabase MCP | Project URL + key | ⚠️ | N/A | Covenant zero-setup for evaluate tools |

## Antigravity friction — status

| Issue | v0.2 fix |
|---|---|
| preflight requires GoPlus | Skipped when unset (`GOPLUS_SKIPPED`) |
| preflight requires DEPLOYER key | Evaluate-only; `covenant_sign_attestation` uses hosted API |
| RPC confusion | Default official Pharos Atlantic RPC `atlantic.dplabs-internal.com` (no API key) |
| onboarding friction | `packages/mcp/config/cursor.mcp.json` — no env vars |
| wallet / approval missing | 6 session tools + dashboard `/approve/:id` |
| latency | Fast health; lazy public client init |

## Remaining gaps (v0.3)

- Hosted MCP SSE at `https://api.covenant.xyz/mcp`
- Persistent session store (Postgres/Redis)
- Smithery marketplace listing
- Full GuardedExecutor tx on ApprovePage
- `@covenant` npm org scope (403 on publish)

## Benchmark targets

See [BENCHMARK_REPORT.json](./BENCHMARK_REPORT.json) for latest run.

| Tool | Target |
|---|---|
| startup | < 3000 ms |
| covenant_health | < 1000 ms |
| covenant_reputation | < 2000 ms |
| covenant_simulate | < 3000 ms |
| covenant_preflight | < 5000 ms |
