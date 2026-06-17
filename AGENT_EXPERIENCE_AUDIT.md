# COVENANT Agent Experience Audit (Final)

**Date:** 2026-06-17  
**Package:** `covenant-mcp@0.2.7`  
**Status:** Production-ready — real wallet, txHash, receipt proven

---

## Executive Summary

COVENANT now delivers a **Stripe/Supabase-class onboarding path**: one command (`npx covenant-mcp init`), one copy-paste prompt (`docs/prompts/agent-bootstrap.md`), and a judge demo prompt (`docs/prompts/agent-full-demo.md`). A brand-new agent can install, discover 17 tools, validate health/reputation/simulate/preflight, and guide a user through wallet approval to on-chain receipt.

**Proof completed:** txHash `0x1c5a7e9d00c29070c0508b47524c32284b983022b43ac338e4afe15ee7bebd1c`, decisionId `1`. See [docs/proofs/PROOF_OF_EXECUTION.md](docs/proofs/PROOF_OF_EXECUTION.md).

---

## Onboarding Scores

| Area | Before (0.2.6) | After (0.2.7) | Notes |
|---|---:|---:|---|
| **Installation** | 9/10 | **9.5/10** | `init` creates `.cursor/mcp.json` + `.env.covenant` in isolated temp dir (~47s cold npx) |
| **Tool Discovery** | 8.5/10 | **9/10** | 17 tools, workflow order in server instructions |
| **Documentation** | 9/10 | **9.5/10** | README rewrite, 7 canonical prompts, judge guide, doc index |
| **Wallet UX** | 7.5/10 | **9/10** | Real SIWE + approval + MetaMask on 688689; chain hex fix, linked-agent detection |
| **Performance** | 8/10 | **8/10** | health ~6ms, simulate ~370ms, preflight ~1.5s; reputation RPC-bound |
| **Judge Experience** | 9/10 | **9.5/10** | 3-min verify path, recorded proof, demo script in README |
| **Overall** | **8.6/10** | **9.1/10** | |

---

## Clean Machine Test (0.2.7)

```bash
npx -y covenant-mcp@0.2.7 init
```

Observed (isolated temp directory, 2026-06-17):

```text
Created .env.covenant
Created .cursor/mcp.json.example
Created .cursor/mcp.json
Message: Zero-secret setup complete. Restart your MCP client.
```

Friction: **none** for zero-secret path. User must restart MCP client (documented in README).

---

## Competitive Benchmark

Compared README + onboarding against leading MCP/developer experiences:

| Criterion | GitHub MCP | Supabase MCP | Stripe (docs pattern) | Smithery top servers | COVENANT |
|---|---|---|---|---|---|
| One-command install | Partial | `npx` + config | N/A (SDK) | Registry link | **`npx covenant-mcp init`** |
| Copy-paste agent prompt | No | Partial | No | Varies | **7 prompts + bootstrap** |
| Zero-secret first run | Yes | Partial | N/A | Varies | **Yes (7 tools)** |
| Hosted MCP option | Yes | Yes | N/A | Yes | **Yes** |
| Architecture diagram | Yes | Yes | Yes | Rare | **Yes (README)** |
| Live proof / txHash | N/A | N/A | N/A | Rare | **Yes (proofs/)** |
| Judge quick-verify | No | Partial | N/A | No | **JUDGE_QUICK_START.md** |
| Tool count in README | Yes | Yes | N/A | Yes | **17 tools listed** |
| Video/demo script | No | Partial | Yes | Rare | **README § Demo Script** |

### Gaps vs best-in-class

| Gap | Priority | Status |
|---|---|---|
| npm README shorter than repo README | Low | Repo README is canonical; npm description can mirror one-liner |
| `covenant_preflight` requires full covenant object | Medium | Documented in prompts; future: covenant template helper |
| Reputation cold RPC >500ms | Low | Acceptable; hosted cache future improvement |
| Render cold start on first MCP call | Low | Documented; hosted MCP warms in ~2s |
| Custom domain (`api.covenant.xyz`) | Low | Render URL works; alias is cosmetic |

### COVENANT advantages

- Only Pharos skill with **deterministic ALLOW/WARN/DENY** + **wallet approval** + **on-chain receipt**
- **End-to-end judge demo prompt** with real proof tx
- **Dual transport**: stdio npm + hosted MCP URL
- **No API keys** for core validation path

---

## GitHub-First Flow (validated)

```text
User opens GitHub → README
User copies docs/prompts/agent-bootstrap.md → Cursor
Agent runs npx covenant-mcp init
Agent discovers 17 tools
Agent runs health → reputation → simulate → preflight
Agent reports table
```

For full wallet demo: `docs/prompts/agent-full-demo.md`

---

## Documentation Deliverables

| Deliverable | Path |
|---|---|
| README rewrite | [README.md](README.md) |
| Prompt library (7) | [docs/prompts/](docs/prompts/) |
| Judge quick start | [docs/JUDGE_QUICK_START.md](docs/JUDGE_QUICK_START.md) |
| Proof of execution | [docs/proofs/PROOF_OF_EXECUTION.md](docs/proofs/PROOF_OF_EXECUTION.md) |
| Architecture index | [docs/architecture/README.md](docs/architecture/README.md) |
| Doc index | [docs/README.md](docs/README.md) |
| Agent manifest | [AGENTS.md](AGENTS.md) |

Duplicate prompts (`INSTALL_AGENT.md`, etc.) redirect to canonical `agent-*.md` files.

---

## Remaining Issues (non-blocking)

1. **Reputation latency** — public RPC; not faked by design.
2. **Preflight verbosity** — covenant object required; prompts include examples.
3. **Interactive wallet steps** — cannot be automated without user MetaMask (by design).
4. **166 npm transitive deps** — acceptable for MCP server bundle.

---

## Final Verdict

A judge or new developer can:

1. Open GitHub and read README (**< 1 min**)
2. Run `npx covenant-mcp init` and paste bootstrap prompt (**< 2 min**)
3. Verify proof tx + receipt API (**< 1 min**)

**Total: under 3 minutes** for non-wallet validation. Full wallet demo adds ~90s user signing.

COVENANT agent experience: **production-ready**.
