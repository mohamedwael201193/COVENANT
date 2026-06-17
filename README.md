# COVENANT

**A reusable Pharos Skill that enables AI agents to evaluate risk, obtain wallet authorization, execute safely, and generate verifiable receipts.**

[![npm](https://img.shields.io/npm/v/covenant-mcp)](https://www.npmjs.com/package/covenant-mcp)
[![Pharos Skill](https://img.shields.io/badge/Pharos-Skill_Atlantic-688689)](https://atlantic.pharosscan.xyz)
[![MCP tools](https://img.shields.io/badge/MCP-17_tools-blue)](docs/MCP_REFERENCE.md)

> **The Trust and Authorization Layer for the Pharos Agent Economy.**

COVENANT is **not** an app or dashboard. It is **reusable infrastructure** — any Pharos Agent that moves value can call COVENANT before execution.

```text
Agent  →  Business Logic Skill  →  COVENANT  →  Wallet Approval  →  Pharos Execution  →  DecisionLog Receipt
```

**Why agents need COVENANT:**

- LLMs can call tools — but cannot safely authorize on-chain value movement
- Pharos Agents need deterministic trust, wallet-native approval, and accountable receipts
- Every Skill that transfers, pays, or executes should route through COVENANT first

| | |
|---|---|
| **Install** | `npx -y covenant-mcp init` |
| **Hosted MCP** | `https://covenant-skill.onrender.com/mcp` |
| **npm** | `covenant-mcp@0.2.7` |
| **Chain** | Pharos Atlantic `688689` |

---

## Why COVENANT Exists For Pharos

Pharos is building the **AI Agent Economy**. Agents will move value, make decisions, interact with users, call Skills, and execute on-chain actions.

Those agents need:

| Need | COVENANT provides |
|---|---|
| **Trust** | Pharos Trust Capital via `covenant_reputation` |
| **Authorization** | SIWE sessions + wallet approval URLs |
| **Risk controls** | Deterministic `ALLOW` / `WARN` / `DENY` preflight |
| **Receipts** | Immutable `DecisionLog` entries on Pharos Atlantic |
| **Accountability** | On-chain attestation verified by `GuardedExecutor` |

COVENANT sits between **agent intent** and **on-chain execution** — like Stripe for agent authorization, WalletConnect for agent approvals.

---

## Built For Pharos

| Pharos-native component | Role |
|---|---|
| **Pharos Atlantic** (`688689`) | Production deployment chain |
| **IdentityRegistry** | Owner ↔ agent mapping for intents |
| **CovenantRegistry** | On-chain policy hashes |
| **GuardedExecutor** | Attestation-gated execution |
| **DecisionLog** | Verifiable decision receipts |
| **ReputationRegistry** | Trust Capital scores and tiers |
| **MetaMask / SIWE** | Wallet-native user approval |

Future Pharos Agents inherit trust, limits, and audit trails without rebuilding authorization from scratch.

Full contract addresses: [docs/architecture/README.md](docs/architecture/README.md)

---

## Installation

```bash
npx -y covenant-mcp init
```

Restart your MCP client. Creates `.cursor/mcp.json` (zero secrets required).

**Hosted MCP** (no local Node):

```json
{ "mcpServers": { "covenant": { "url": "https://covenant-skill.onrender.com/mcp" } } }
```

Extended setup: [docs/skill/INSTALL.md](docs/skill/INSTALL.md) · Client configs: [docs/skill/INTEGRATIONS.md](docs/skill/INTEGRATIONS.md)

---

## Recommended Demo Flow

**Official workflow** for new users, judges, demo videos, and hackathon reviewers.

Open GitHub → copy prompt → paste into Cursor → watch it work.

| Step | Prompt | What happens |
|---|---|---|
| **1** | [docs/prompts/01-install-covenant.md](docs/prompts/01-install-covenant.md) | `npx -y covenant-mcp init` → restart → 17 tools + `covenant_health` |
| **2** | [docs/prompts/02-validate-skills.md](docs/prompts/02-validate-skills.md) | Run 5 core tools → Skill / Trust / Risk summaries |
| **3** | [docs/prompts/03-end-to-end-workflow.md](docs/prompts/03-end-to-end-workflow.md) | Wallet → approval → txHash → receipt |

No debugging. No scripts. MCP tools only.

---

## 30-Second Quick Start

| Step | Action |
|---|---|
| 1 | Paste [01-install-covenant.md](docs/prompts/01-install-covenant.md) |
| 2 | Restart Cursor when prompted |
| 3 | Paste [02-validate-skills.md](docs/prompts/02-validate-skills.md) |

**Expected:**

```text
✓ 17 tools discovered
✓ covenant_health        → status: ok, chainId: 688689
✓ covenant_reputation    → Trust Capital tier
✓ covenant_simulate      → eth_call result
✓ covenant_preflight     → ALLOW | WARN | DENY
```

---

## What Agents Can Do

| Agent goal | COVENANT tool |
|---|---|
| Check trust before acting | `covenant_reputation` |
| Review transaction risk | `covenant_preflight` |
| Dry-run calldata | `covenant_simulate` |
| Check recipient risk | `covenant_verify_counterparty` |
| Request wallet connect | `covenant_connect_wallet` |
| Request user approval | `covenant_request_approval` |
| Execute after approval | User signs via `approvalUrl` |
| Verify on-chain receipt | `covenant_get_receipt` |

17 tools total → [docs/MCP_REFERENCE.md](docs/MCP_REFERENCE.md)

---

## Real Production Outputs

Captured from live `covenant-mcp@0.2.7` and Pharos Atlantic production (`decisionId: 1`).

### `covenant_health`

```json
{
  "status": "ok",
  "chainId": 688689,
  "attesterAddress": "0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3",
  "mode": "zero-rpc-fast",
  "message": "MCP server loaded. Use covenant_simulate or covenant_reputation to verify live RPC reads."
}
```

### `covenant_reputation`

```json
{
  "status": "ok",
  "agent": "0x05545F026b75f03aE9Cf1eA8a8373473c94ed323",
  "score": "0",
  "tier": 0,
  "updatedAt": "0",
  "source": "pharos"
}
```

### `covenant_preflight` (production execution path)

```json
{
  "verdict": "WARN",
  "intentHash": "0xe698c3c90c0b010d7259bdaf9453fbefd0f9db4db1d5593f81f002d7aac3dab4",
  "violations": [
    {
      "code": "REPUTATION_UNAVAILABLE",
      "message": "Trust Capital read timed out or failed; using conservative tier 0 for this preflight.",
      "severity": "warn"
    }
  ],
  "simulation": { "success": true }
}
```

### `covenant_get_receipt` (`GET /api/receipt/1`)

```json
{
  "id": "1",
  "agent": "0xfBb4A658f89736eD40CAAAD735bcedb3272C4600",
  "intentHash": "0xe698c3c90c0b010d7259bdaf9453fbefd0f9db4db1d5593f81f002d7aac3dab4",
  "verdict": "ALLOW",
  "reasonHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "outcomeHash": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
  "timestamp": "1781712215"
}
```

On-chain tx: [PharosScan](https://atlantic.pharosscan.xyz/tx/0x1c5a7e9d00c29070c0508b47524c32284b983022b43ac338e4afe15ee7bebd1c) · Full proof: [docs/proofs/PROOF_OF_EXECUTION.md](docs/proofs/PROOF_OF_EXECUTION.md)

---

## COVENANT vs Other Skills

| Feature | Generic Pharos Skill | **COVENANT** |
|---|---|---|
| Trust Capital | — | ✅ Pharos `ReputationRegistry` |
| Risk evaluation | LLM guess | ✅ Deterministic `ALLOW`/`WARN`/`DENY` |
| Wallet authorization | Custodial keys | ✅ SIWE + approval URLs |
| Decision receipts | — | ✅ `DecisionLog` on Pharos |
| On-chain verification | — | ✅ `GuardedExecutor` attestation |
| Pharos integration | Varies | ✅ Native Atlantic contracts |
| Agent accountability | — | ✅ Auditable intent + receipt chain |

COVENANT does not compete with Skills. **It secures Skills.**

---

## How COVENANT Composes With Other Pharos Skills

Every Skill that moves value should call COVENANT first:

| Pharos Skill | + COVENANT |
|---|---|
| **Trading Skill** | Preflight swap intent → wallet approval → guarded execute |
| **Payment Skill** | Reputation check → preflight transfer → receipt |
| **Treasury Skill** | Policy limits → multi-sig approval URL → DecisionLog |
| **DAO Skill** | Proposal execution preflight → member wallet sign |
| **DeFi Skill** | Simulate + counterparty check → attestation → execute |
| **Research Skill** | Risk review before acting on findings |
| **Agent Marketplace** | Trust tier gates what marketplace agents can spend |

```text
Your Skill.prepareIntent()  →  covenant_preflight  →  covenant_request_approval  →  Pharos tx  →  covenant_get_receipt
```

Integration guide: [docs/skill/INTEGRATIONS.md](docs/skill/INTEGRATIONS.md)

---

## COVENANT In The Pharos Agent Stack

```text
┌─────────────────────────────────────────────────────────┐
│  Agent (Cursor / Claude / OpenAI / Antigravity / …)     │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Business Logic Skill (Trading, Payments, DAO, …)       │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  COVENANT — trust · preflight · attestation             │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Wallet Approval — user signs in MetaMask (688689)      │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Pharos Execution — GuardedExecutor on Atlantic         │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  DecisionLog Receipt — verifiable audit trail           │
└─────────────────────────────────────────────────────────┘
```

---

## Wallet Flow (Summary)

```text
covenant_connect_wallet → [user SIWE] → covenant_create_session
→ covenant_preflight → covenant_sign_attestation → covenant_request_approval
→ [user approves] → covenant_get_receipt
```

Details: [docs/skill/EXAMPLES.md](docs/skill/EXAMPLES.md) · Security: [docs/SECURITY.md](docs/SECURITY.md)

---

## Screenshots

| | |
|---|---|
| Health + tools | ![Health check](assets/health-check.svg) |
| Wallet approval | ![Wallet approval](assets/wallet-approval.svg) |
| Decision receipt | ![Receipt](assets/receipt.svg) |
| PharosScan proof | ![PharosScan](assets/pharosscan-proof.svg) |

Replace SVG placeholders with captures — see [assets/README.md](assets/README.md).

---

## Agent Installation Prompts

**Canonical demo prompts** (use these):

| Step | Prompt |
|---|---|
| 1 — Install | [01-install-covenant.md](docs/prompts/01-install-covenant.md) |
| 2 — Validate skills | [02-validate-skills.md](docs/prompts/02-validate-skills.md) |
| 3 — End-to-end | [03-end-to-end-workflow.md](docs/prompts/03-end-to-end-workflow.md) |

Works in **Cursor**, **Claude Desktop**, **Claude Code**, **OpenAI Agents**, **Antigravity**, and future Pharos Agents.

Placeholders: `<YOUR_WALLET_ADDRESS>` · `<YOUR_AGENT_ADDRESS>` · `<TARGET_ADDRESS>`

Legacy prompts redirect to the canonical three above.

---

## FAQ

**Is COVENANT a wallet or dashboard?**  
No. It is a Pharos Skill — MCP tools + on-chain contracts. The web UI is a demo helper for wallet signing.

**Do I need API keys?**  
No for core tools. Optional GoPlus keys for counterparty signals.

**How do I verify production proof?**  
[docs/JUDGE_QUICK_START.md](docs/JUDGE_QUICK_START.md) (for reviewers)

**Full technical reference?**  
[docs/MCP_REFERENCE.md](docs/MCP_REFERENCE.md) · [docs/API_REFERENCE.md](docs/API_REFERENCE.md) · [docs/architecture/](docs/architecture/)

---

## Documentation

| Doc | For |
|---|---|
| [docs/README.md](docs/README.md) | Documentation index |
| [docs/MCP_REFERENCE.md](docs/MCP_REFERENCE.md) | All 17 tool schemas |
| [docs/skill/EXAMPLES.md](docs/skill/EXAMPLES.md) | Workflow examples |
| [AGENTS.md](AGENTS.md) | Agent skill manifest |

**Links:** [GitHub](https://github.com/mohamedwael201193/COVENANT) · [npm](https://www.npmjs.com/package/covenant-mcp) · [Skill API](https://covenant-skill.onrender.com)
