# COVENANT Competitive Analysis (v0.2)

## vs GitHub MCP, Stripe MCP, Supabase MCP

| Dimension | GitHub MCP | Stripe MCP | Supabase MCP | **COVENANT v0.2** |
|---|---|---|---|---|
| Install | `npx @modelcontextprotocol/server-github` | Stripe agent toolkit | `npx @supabase/mcp` | `npx covenant-mcp` |
| Zero-setup tools | Needs PAT | Needs API key | Needs project URL + key | **health/reputation/simulate/preflight — no keys** |
| Wallet UX | N/A | Stripe account | N/A | **SIWE + approval URLs** |
| Auth | OAuth/PAT | Secret key | Service role key | **Session tokens, no agent keys** |
| On-chain | No | Payments off-chain | Postgres | **Pharos GuardedExecutor native** |
| Human approval | N/A | Dashboard | RLS policies | **covenant_request_approval URL** |

## Wallet architecture chosen: **Hybrid E (SIWE + session + approval URL)**

Compared options A–D: user-per-tx signing is safest but worst UX; session tokens + browser approval URL balances agent autonomy with human-in-the-loop for value movement. ERC-4337 session keys planned v0.3.

## Scorecard

| Metric | v0.1 | **v0.2 target** | Gap |
|---|---|---|---|
| Installation | 6 | **9** | Publish `@covenant` scope optional |
| Discoverability | 8 | **9** | Smithery listing |
| Performance | 6 | **8** | LLM off by default ✓ |
| Security | 8 | **9** | Full SIWE crypto verify |
| Wallet UX | 3 | **8** | Approval page ✓, deep wallet connect |
| Agent UX | 7 | **9** | Zero-setup preflight ✓ |
| Documentation | 6 | **9** | README ✓, screenshots TBD |
| Pharos alignment | 10 | **10** | — |

**Current: 8.4/10** · **Target: 9.2/10**

## How COVENANT surpasses generic MCP servers

Only MCP purpose-built for **on-chain agent trust** with **secret-free evaluation**, **hosted attestation**, and **wallet approval flow** without custodial keys.
