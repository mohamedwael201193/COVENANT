# Documentation Map

Single source of truth for COVENANT documentation.

## Entry points

| Audience | Start here |
|---|---|
| **Developers** | [README.md](../README.md) |
| **AI agents** | [AGENTS.md](../AGENTS.md) + [prompts/](./prompts/) |
| **Judges / reviewers** | [JUDGE_QUICK_START.md](./JUDGE_QUICK_START.md) |
| **Operators** | [DEPLOYMENT.md](./DEPLOYMENT.md) |

---

## Hierarchy

```text
README.md                          ← Product overview, install, tools, workflows
├── AGENTS.md                      ← Agent skill manifest (MCP clients)
├── docs/
│   ├── README.md                  ← This index
│   ├── DOCUMENTATION_MAP.md       ← Full map (this file)
│   ├── MCP_REFERENCE.md           ← 17 tool schemas (canonical)
│   ├── API_REFERENCE.md           ← REST API
│   ├── ARCHITECTURE.md            ← System design (full)
│   ├── SECURITY.md                ← Threat model
│   ├── DEPLOYMENT.md              ← Render + Vercel ops
│   ├── TROUBLESHOOTING.md         ← Error fixes
│   ├── JUDGE_QUICK_START.md       ← Hackathon / demo verification
│   ├── architecture/
│   │   └── README.md              ← Architecture summary → ARCHITECTURE.md
│   ├── proofs/
│   │   ├── README.md
│   │   └── PROOF_OF_EXECUTION.md  ← On-chain proof (demo addresses)
│   ├── prompts/                   ← Copy-paste agent prompts (canonical)
│   │   ├── 01-install-covenant.md   ← Install + health
│   │   ├── 02-validate-skills.md    ← 5-tool demo
│   │   ├── 03-end-to-end-workflow.md ← Wallet → receipt
│   │   └── agent-*.md               ← Redirects to 01/02/03
│   ├── skill/
│   │   ├── INSTALL.md             ← Extended install + secrets
│   │   ├── EXAMPLES.md            ← Workflow examples (canonical)
│   │   └── INTEGRATIONS.md        ← Client integrations
│   └── submission/                ← Hackathon submission only
│       ├── DEMO_GUIDE.md
│       ├── JUDGE_TESTING_GUIDE.md
│       └── SUBMISSION_CHECKLIST.md
```

---

## Canonical vs redirects

| Canonical | Redirects to canonical |
|---|---|
| `docs/prompts/01-install-covenant.md` | `agent-install.md`, `INSTALL_AGENT.md`, `agent-bootstrap.md` (partial) |
| `docs/prompts/02-validate-skills.md` | `agent-bootstrap.md`, `agent-health-check.md`, `agent-reputation-review.md`, `agent-risk-review.md`, `agent-counterparty-check.md`, `judge-demo.md`, `RISK_REVIEW.md`, `COUNTERPARTY_CHECK.md`, `agent-preflight.md`, `agent-covenant-audit.md` |
| `docs/prompts/03-end-to-end-workflow.md` | `agent-end-to-end.md`, `video-demo.md`, `agent-full-demo.md`, `agent-wallet-authorization.md`, `agent-request-approval.md`, `agent-send-money.md`, `WALLET_SETUP.md`, `SEND_TRANSACTION.md`, `agent-wallet-review.md` |
| `docs/proofs/PROOF_OF_EXECUTION.md` | `docs/PROOF_OF_EXECUTION.md` |
| `README.md` (install) | `docs/skill/INSTALL.md` (extended only) |

---

## Removed / deprecated

These should not be edited — they redirect:

- `docs/prompts/INSTALL_AGENT.md`
- `docs/prompts/WALLET_SETUP.md`
- `docs/prompts/SEND_TRANSACTION.md`
- `docs/prompts/RISK_REVIEW.md`
- `docs/prompts/COUNTERPARTY_CHECK.md`
- `docs/prompts/agent-preflight.md`
- `docs/prompts/agent-covenant-audit.md`
- `docs/prompts/agent-wallet-review.md`
- `docs/prompts/agent-full-demo.md`
- `docs/PROOF_OF_EXECUTION.md`

Consider consolidating `docs/skill/COMPARISON.md` and `docs/skill/COMPETITIVE.md` in a future pass.
