# COVENANT

**COVENANT is a Trust, Authorization and Execution Skill for AI Agents on Pharos.**

[![npm](https://img.shields.io/npm/v/covenant-mcp)](https://www.npmjs.com/package/covenant-mcp)
[![Tools](https://img.shields.io/badge/MCP_tools-17-blue)](docs/MCP_REFERENCE.md)
[![Proof](https://img.shields.io/badge/on--chain_proof-verified-green)](docs/proofs/PROOF_OF_EXECUTION.md)

```text
Agent → COVENANT MCP → Risk Evaluation → Wallet Approval → Guarded Execution → Decision Receipt
```

| | |
|---|---|
| **Install** | `npx -y covenant-mcp init` |
| **Hosted MCP** | `https://covenant-skill.onrender.com/mcp` |
| **npm** | `covenant-mcp@0.2.7` |
| **Tools** | 17 (`covenant_*`) |
| **Proof** | ✅ Real txHash + DecisionLog receipt — [verify](docs/proofs/PROOF_OF_EXECUTION.md) |

---

## Judge Quick Start (< 60s)

| Step | Action |
|---|---|
| 1 | `npx -y covenant-mcp init` |
| 2 | Paste **[`docs/prompts/judge-demo.md`](docs/prompts/judge-demo.md)** into Cursor |
| 3 | Agent discovers **17 tools** and runs health → reputation → simulate → preflight |
| 4 | Review **[Proof of Execution](docs/proofs/PROOF_OF_EXECUTION.md)** |

No wallet required. No user interaction.

---

## Video Demo Flow (~90s)

| Step | Action |
|---|---|
| 1 | Open Cursor (fresh chat) |
| 2 | Paste **[`docs/prompts/video-demo.md`](docs/prompts/video-demo.md)** |
| 3 | Approve wallet at `connectUrl` and `approvalUrl` |
| 4 | Show `txHash` on PharosScan |
| 5 | Show receipt via `covenant_get_receipt` |

---

## Why COVENANT Exists

**Problem:** AI agents can call tools but cannot safely move value — no deterministic trust, no wallet-native approval, no on-chain receipts.

**Solution:** COVENANT provides Trust Capital, risk evaluation (`ALLOW`/`WARN`/`DENY`), wallet authorization, guarded execution, and DecisionLog receipts. No private keys in agents.

| Capability | Tool |
|---|---|
| Trust Capital | `covenant_reputation` |
| Risk Evaluation | `covenant_preflight`, `covenant_simulate`, `covenant_verify_counterparty` |
| Wallet Authorization | `covenant_connect_wallet`, `covenant_create_session` |
| Approval | `covenant_request_approval` |
| Guarded Execution | User signs via approval URL → `GuardedExecutor` |
| Receipts | `covenant_get_receipt` |

---

## 2-Minute Quick Start

```bash
npx -y covenant-mcp init
```

Creates `.cursor/mcp.json` + `.env.covenant`. Restart your MCP client, then paste **[`docs/prompts/agent-bootstrap.md`](docs/prompts/agent-bootstrap.md)**.

**Hosted MCP** (no local Node):

```json
{ "mcpServers": { "covenant": { "url": "https://covenant-skill.onrender.com/mcp" } } }
```

---

## Prompt Library

| Prompt | Use when | Wallet? |
|---|---|---|
| **[`judge-demo.md`](docs/prompts/judge-demo.md)** | Hackathon judges — fastest path | No |
| **[`video-demo.md`](docs/prompts/video-demo.md)** | Recording submission video | Yes |
| [`agent-bootstrap.md`](docs/prompts/agent-bootstrap.md) | First install + validation | No |
| [`agent-health-check.md`](docs/prompts/agent-health-check.md) | 10s smoke test | No |
| [`agent-risk-review.md`](docs/prompts/agent-risk-review.md) | Preflight before any tx | No |
| [`agent-wallet-authorization.md`](docs/prompts/agent-wallet-authorization.md) | SIWE + approval URLs | Yes |
| [`agent-send-money.md`](docs/prompts/agent-send-money.md) | Full send workflow | Yes |
| [`agent-counterparty-check.md`](docs/prompts/agent-counterparty-check.md) | Recipient risk | No |

---

## Demo Addresses (Optional)

These addresses appear **only** in [proof documentation](docs/proofs/PROOF_OF_EXECUTION.md) for judge verification. **Replace with your own** wallet and agent addresses in all prompts and workflows.

| Role | Proof address (do not use in prompts) |
|---|---|
| Owner wallet | `0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3` |
| Linked agent | `0xfBb4A658f89736eD40CAAAD735bcedb3272C4600` |
| Proof txHash | `0x1c5a7e9d00c29070c0508b47524c32284b983022b43ac338e4afe15ee7bebd1c` |

For generic validation without a wallet, prompts use the public **IdentityRegistry** contract (`0x05545F026b75f03aE9Cf1eA8a8373473c94ed323`) as a probe address.

---

## Standard Agent Workflow

```text
covenant_health → covenant_reputation → covenant_simulate → covenant_preflight
→ covenant_sign_attestation → covenant_connect_wallet → covenant_request_approval
→ [user approves] → covenant_get_receipt
```

---

## 17 MCP Tools

**Zero-setup:** `covenant_health` · `covenant_reputation` · `covenant_simulate` · `covenant_preflight` · `covenant_verify_counterparty` · `covenant_get_receipt` · `covenant_sign_attestation`

**Wallet flow:** `covenant_connect_wallet` · `covenant_create_session` · `covenant_request_approval` · `covenant_get_pending_approvals` · `covenant_execute_authorized` · `covenant_revoke_session`

**Owner / oracle:** `covenant_register_identity` · `covenant_set_covenant` · `covenant_rotate_key` · `covenant_attest_outcome`

Schemas: [`docs/MCP_REFERENCE.md`](docs/MCP_REFERENCE.md)

---

## Pharos Atlantic

| Resource | Value |
|---|---|
| Chain ID | `688689` (`0xa8231`) |
| RPC | `https://atlantic.dplabs-internal.com` |
| Explorer | https://atlantic.pharosscan.xyz |

| Contract | Address |
|---|---|
| GuardedExecutor | `0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F` |
| DecisionLog | `0x8A80D270dd7028536ecB6f92b04eec11F929d603` |
| IdentityRegistry | `0x05545F026b75f03aE9Cf1eA8a8373473c94ed323` |
| CovenantRegistry | `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770` |
| ReputationRegistry | `0x92b8815A17D85E45DB5Da9952764Ee2ce072A973` |

---

## Client Setup

<details><summary><strong>Cursor / Antigravity</strong></summary>

`npx covenant-mcp init` → restart → paste `judge-demo.md` or `video-demo.md`.

</details>

<details><summary><strong>Claude Desktop / Claude Code</strong></summary>

```bash
claude mcp add covenant -- npx -y covenant-mcp
claude mcp add --transport http covenant https://covenant-skill.onrender.com/mcp
```

</details>

<details><summary><strong>OpenAI Agents SDK</strong></summary>

```ts
hostedMcpTool({ serverLabel: "covenant", serverUrl: "https://covenant-skill.onrender.com/mcp", requireApproval: "never" })
```

</details>

---

## Security & FAQ

- No private keys in agents. Wallet approval required for execution.
- No API keys needed for core validation tools.
- MetaMask must use chain **688689** — delete stale 688545 network.
- Web UI is a demo only; agents use MCP tools.

Details: [`docs/SECURITY.md`](docs/SECURITY.md) · [`docs/JUDGE_QUICK_START.md`](docs/JUDGE_QUICK_START.md)

---

## Documentation

| Doc | Description |
|---|---|
| [docs/README.md](docs/README.md) | Full doc index |
| [docs/proofs/PROOF_OF_EXECUTION.md](docs/proofs/PROOF_OF_EXECUTION.md) | On-chain proof |
| [docs/architecture/README.md](docs/architecture/README.md) | System design |
| [AGENTS.md](AGENTS.md) | Agent skill manifest |

**Links:** [GitHub](https://github.com/mohamedwael201193/COVENANT) · [npm](https://www.npmjs.com/package/covenant-mcp) · [Skill API](https://covenant-skill.onrender.com) · [Approval UI](https://covenant-web-mu.vercel.app)
