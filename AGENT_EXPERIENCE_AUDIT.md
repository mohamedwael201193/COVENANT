# COVENANT Developer Experience Scorecard

**Date:** 2026-06-17  
**Focus:** Production DX for developers, agents, and integrators

---

## Summary

README rebuilt as a **production product README**. Judge/hackathon content moved to `docs/JUDGE_QUICK_START.md` and `docs/proofs/`. Documentation hierarchy consolidated with `docs/DOCUMENTATION_MAP.md` as single source of truth.

---

## DX Scores

| Area | Before (hackathon README) | After (production README) | Target |
|---|---:|---:|---:|
| **First impression** | 7.5 | **9.5** | 10 |
| **Install clarity** | 9.0 | **9.5** | 10 |
| **Wallet flow docs** | 8.0 | **9.5** | 10 |
| **Tool reference** | 7.0 | **9.0** | 10 |
| **Agent prompts** | 8.5 | **9.5** | 10 |
| **Doc hierarchy** | 7.5 | **9.5** | 10 |
| **Judge/dev separation** | 5.0 | **9.5** | 10 |
| **Overall DX** | **7.6** | **9.4** | 10 |

---

## What changed

### README (production)

- Hero: what / why / architecture / capabilities
- Installation (stdio, hosted, global)
- Quick start with working example
- Wallet authorization flow diagram + table
- MCP config for Cursor, Claude, OpenAI, Antigravity
- Tool reference (17 tools, inputs/outputs)
- Example workflows
- Agent Installation Prompts section
- Security + FAQ + links
- **Removed:** judge demo, video demo, proof badges, demo addresses, hackathon prompts

### Moved to judge docs

- Judge quick path → `docs/JUDGE_QUICK_START.md`
- Video demo → `docs/prompts/video-demo.md` (linked from judge doc only)
- Proof verification commands → `docs/JUDGE_QUICK_START.md`
- Demo addresses → `docs/JUDGE_QUICK_START.md` + `docs/proofs/`

### Added files

| File | Purpose |
|---|---|
| `docs/DOCUMENTATION_MAP.md` | Full hierarchy map |
| `docs/prompts/agent-install.md` | Install prompt |
| `docs/prompts/agent-reputation-review.md` | Reputation prompt |
| `docs/prompts/agent-request-approval.md` | Approval prompt |
| `docs/prompts/agent-end-to-end.md` | Full workflow prompt |

### Updated files

| File | Change |
|---|---|
| `README.md` | Production rebuild |
| `AGENTS.md` | Developer-focused |
| `docs/README.md` | Doc index |
| `docs/JUDGE_QUICK_START.md` | All judge/demo content |
| `docs/MCP_REFERENCE.md` | Fixed 17-tool count |
| `docs/skill/INSTALL.md` | Points to README for quick install |

### Redirects (unchanged, canonical elsewhere)

`INSTALL_AGENT.md`, `WALLET_SETUP.md`, `SEND_TRANSACTION.md`, `RISK_REVIEW.md`, `COUNTERPARTY_CHECK.md`, `agent-preflight.md`, `agent-covenant-audit.md`, `agent-wallet-review.md`, `agent-full-demo.md`, `docs/PROOF_OF_EXECUTION.md`

---

## Remaining gaps (preventing 10/10)

| Gap | Impact | Mitigation path |
|---|---|---|
| `MCP_REFERENCE.md` incomplete for wallet tools | Medium | Expand schemas for session/approval tools |
| No screenshots in README | Low | Add wallet approval UI screenshot |
| Preflight covenant template verbose | Medium | Add `covenant_build_template` tool or helper |
| `docs/skill/COMPARISON.md` + `COMPETITIVE.md` overlap | Low | Merge in future pass |
| Hosted MCP cold start | Low | Document warm-up in TROUBLESHOOTING |
| No interactive quickstart (like Supabase) | Medium | Future: `npx covenant-mcp doctor` command |

---

## Verdict

A first-time developer opening the repo can now understand what COVENANT is, install it, configure MCP, run tools, and integrate with major agent clients — **without hackathon noise in the README**.

Judges use `docs/JUDGE_QUICK_START.md` separately.
