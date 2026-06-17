# COVENANT vs Top MCP Servers

Comparison against widely adopted MCP servers on GitHub (patterns, not feature parity).

## Reference servers

| Server | Stars / adoption | Primary pattern |
|---|---|---|
| [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) (GitHub, Filesystem, Postgres) | Official reference | Thin adapters, rich tool descriptions, read/write hints |
| [stripe/agent-toolkit](https://github.com/stripe/agent-toolkit) | Payments for agents | Intent-oriented tools, strong schemas, SDK + MCP |
| [anthropics/claude-code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp) | Cursor/Claude native | stdio, env-based auth, one `npx` install |
| [Supabase MCP](https://github.com/supabase-community/supabase-mcp) | DB for agents | Namespaced tools, server instructions, hosted option |

## What they do better (today)

| Area | GitHub / Stripe / Supabase pattern | COVENANT gap (before productization) |
|---|---|---|
| Install | `npx -y @scope/mcp` published to npm | Was monorepo-only, bundled with REST |
| Tool descriptions | Paragraph-level when/when-not | Was one-line strings |
| Auth | OAuth or env — keys never in tool args | Owner key in some tool inputs |
| Hosted mode | Supabase/Stripe offer cloud MCP | Only self-hosted stdio + Render REST |
| Resources | Filesystem/GitHub expose resources | No MCP resources yet |
| Marketplace listing | Smithery, Glama, PulseMCP | Not listed |

## What COVENANT does better

| Area | COVENANT advantage |
|---|---|
| Domain | Only MCP focused on **on-chain agent trust** + Pharos |
| Safety model | Deterministic ALLOW — LLM cannot authorize |
| Composability | Full pipeline: identity → policy → preflight → receipt → reputation |
| Chain native | EIP-712 attestations, GuardedExecutor, DecisionLog |
| Ecosystem | Built for Pharos Atlantic + GoPlus + Trust Capital |
| Verifiability | Receipts on-chain, not opaque logs |

## How to surpass them

1. **Publish `covenant-mcp` to npm** — one-command install ✅ (this release)
2. **Namespaced tools + workflow instructions** ✅
3. **Hosted MCP (SSE)** on Render — no local keys for read tools
4. **MCP resources** — `covenant://receipt/{id}`, `covenant://agent/{addr}/covenant`
5. **Smithery / PulseMCP listing** — marketplace discovery
6. **Remove private keys from tool schemas** — env-only signing service
7. **Prompts** — `covenant-send-payment` prompt template in MCP
8. **Remote attestation API** — agents without Pharos RPC

## Positioning

| Product | Analogy |
|---|---|
| Stripe Agent Toolkit | Payments |
| **COVENANT** | **Trust & policy rail before execution** |
| GitHub MCP | Code access |
| Postgres MCP | Data access |

COVENANT is not "another dashboard API" — it is the **trust primitive** other agents call before they act.
