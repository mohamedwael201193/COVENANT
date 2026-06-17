# COVENANT

**COVENANT is a Trust, Authorization and Execution Skill for AI Agents on Pharos.**

[![npm](https://img.shields.io/npm/v/covenant-mcp)](https://www.npmjs.com/package/covenant-mcp)
[![GitHub](https://img.shields.io/github/stars/mohamedwael201193/COVENANT)](https://github.com/mohamedwael201193/COVENANT)

```text
Agent
  ↓
COVENANT Skill (MCP)
  ↓
Risk Evaluation
  ↓
Wallet Approval
  ↓
Guarded Execution
  ↓
Decision Receipt
```

**Live:** [Skill API](https://covenant-skill.onrender.com) · [Hosted MCP](https://covenant-skill.onrender.com/mcp) · [Approval UI](https://covenant-web-mu.vercel.app) · [Proof](docs/proofs/PROOF_OF_EXECUTION.md)

---

## Why COVENANT Exists

### Problem

Current AI agents can call tools — but they **cannot safely move value**:

- No deterministic trust evaluation before execution
- No wallet-native authorization without custodial keys
- No verifiable receipts or reputation accrual
- LLM judgment is not a security boundary

### Solution

COVENANT provides:

| Capability | Tool |
|---|---|
| **Trust Capital** | `covenant_reputation` |
| **Risk Evaluation** | `covenant_preflight`, `covenant_simulate`, `covenant_verify_counterparty` |
| **Wallet Authorization** | `covenant_connect_wallet`, `covenant_create_session` |
| **Approval Requests** | `covenant_request_approval` |
| **Guarded Execution** | User signs via approval URL → `GuardedExecutor` |
| **Receipts** | `covenant_get_receipt` → `DecisionLog` |

No private keys in agents. No custodial wallets. Deterministic `ALLOW` / `WARN` / `DENY`.

---

## 2-Minute Quick Start

### 1. Install

```bash
npx -y covenant-mcp init
```

This creates:

| File | Purpose |
|---|---|
| `.cursor/mcp.json` | Active MCP config (zero secrets) |
| `.cursor/mcp.json.example` | Reference copy |
| `.env.covenant` | Optional env template |

### 2. Restart your MCP client

Restart **Cursor**, **Claude Desktop**, or **Claude Code** so the new MCP server loads.

### 3. Paste one prompt

Open a **fresh chat** and paste:

```text
You are onboarding COVENANT.

Read the repository README.
Validate the MCP installation.
Discover all tools.

Run:
- covenant_health
- covenant_reputation
- covenant_simulate
- covenant_preflight

Then provide a report.

Do not ask for permission.
Execute the full validation workflow.
```

Full prompt: [`docs/prompts/agent-bootstrap.md`](docs/prompts/agent-bootstrap.md)

**Expected:** 17 tools, `health: ok`, live reputation read, simulate success, preflight verdict.

---

## MCP Config (zero secrets)

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "covenant": {
      "command": "npx",
      "args": ["-y", "covenant-mcp"],
      "env": { "PREFLIGHT_LLM_ENABLED": "false" }
    }
  }
}
```

**Hosted MCP** (no local Node process):

```json
{
  "mcpServers": {
    "covenant": {
      "url": "https://covenant-skill.onrender.com/mcp"
    }
  }
}
```

---

## Demo Script (For Judges)

**Expected duration: ~90 seconds**

| Step | Action |
|---|---|
| 1 | Open fresh Cursor chat |
| 2 | Paste **[Prompt A](docs/prompts/agent-full-demo.md)** (`agent-full-demo.md`) |
| 3 | Agent installs Covenant (`npx covenant-mcp init` if needed) |
| 4 | Agent discovers **17 tools** |
| 5 | Agent runs `covenant_health` |
| 6 | Agent runs `covenant_reputation` |
| 7 | Agent runs `covenant_preflight` |
| 8 | Agent requests wallet approval (`covenant_connect_wallet` → `covenant_request_approval`) |
| 9 | Open `approvalUrl` (or `connectUrl` first for SIWE) |
| 10 | Approve in MetaMask on **chain 688689** |
| 11 | Show `txHash` |
| 12 | Show receipt (`covenant_get_receipt`) |

**Recorded proof:** [docs/proofs/PROOF_OF_EXECUTION.md](docs/proofs/PROOF_OF_EXECUTION.md)

```text
txHash:     0x1c5a7e9d00c29070c0508b47524c32284b983022b43ac338e4afe15ee7bebd1c
decisionId: 1
```

---

## Judge Quick Verify (< 3 min)

```bash
# 1. Install
npx -y covenant-mcp init

# 2. Health
curl -s https://covenant-skill.onrender.com/health

# 3. Proof tx on PharosScan
# https://atlantic.pharosscan.xyz/tx/0x1c5a7e9d00c29070c0508b47524c32284b983022b43ac338e4afe15ee7bebd1c

# 4. Receipt
curl -s https://covenant-skill.onrender.com/api/receipt/1
```

Full guide: [`docs/JUDGE_QUICK_START.md`](docs/JUDGE_QUICK_START.md)

---

## Prompt Library

Copy-paste prompts for agents — no doc hunting:

| Prompt | Use when |
|---|---|
| [`agent-bootstrap.md`](docs/prompts/agent-bootstrap.md) | First install + tool validation |
| [`agent-health-check.md`](docs/prompts/agent-health-check.md) | Quick MCP smoke test |
| [`agent-risk-review.md`](docs/prompts/agent-risk-review.md) | Preflight before any tx |
| [`agent-wallet-authorization.md`](docs/prompts/agent-wallet-authorization.md) | SIWE session + approval URL |
| [`agent-send-money.md`](docs/prompts/agent-send-money.md) | Full send workflow |
| [`agent-counterparty-check.md`](docs/prompts/agent-counterparty-check.md) | Recipient risk check |
| [`agent-full-demo.md`](docs/prompts/agent-full-demo.md) | **End-to-end judge demo** |

---

## Standard Agent Workflow

```text
covenant_health                    # optional readiness
covenant_reputation                # Trust Capital tier
covenant_simulate                  # eth_call debug
covenant_preflight                 # ALLOW | WARN | DENY
covenant_sign_attestation          # hosted signature (no local keys)
covenant_connect_wallet            # SIWE → connectUrl
covenant_create_session            # after user signs
covenant_request_approval          # approvalUrl
[user approves in browser wallet]
covenant_get_receipt               # DecisionLog audit
```

---

## 17 MCP Tools

**Zero-setup (no secrets):**

`covenant_health` · `covenant_reputation` · `covenant_simulate` · `covenant_preflight` · `covenant_verify_counterparty` · `covenant_get_receipt` · `covenant_sign_attestation`

**Wallet flow:**

`covenant_connect_wallet` · `covenant_create_session` · `covenant_request_approval` · `covenant_get_pending_approvals` · `covenant_execute_authorized` · `covenant_revoke_session`

**Owner / oracle (requires deployer key):**

`covenant_register_identity` · `covenant_set_covenant` · `covenant_rotate_key` · `covenant_attest_outcome`

Schemas: [`docs/MCP_REFERENCE.md`](docs/MCP_REFERENCE.md)

---

## Pharos Atlantic (Production)

| Resource | Value |
|---|---|
| Chain ID | `688689` (`0xa8231`) |
| RPC | `https://atlantic.dplabs-internal.com` |
| Explorer | https://atlantic.pharosscan.xyz |
| npm | `covenant-mcp@0.2.7` |

| Contract | Address |
|---|---|
| GuardedExecutor | `0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F` |
| DecisionLog | `0x8A80D270dd7028536ecB6f92b04eec11F929d603` |
| IdentityRegistry | `0x05545F026b75f03aE9Cf1eA8a8373473c94ed323` |
| CovenantRegistry | `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770` |
| ReputationRegistry | `0x92b8815A17D85E45DB5Da9952764Ee2ce072A973` |
| Attester | `0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3` |

---

## Client Setup

<details>
<summary><strong>Cursor</strong></summary>

`npx covenant-mcp init` → restart Cursor → paste `agent-bootstrap.md`.

</details>

<details>
<summary><strong>Claude Desktop / Claude Code</strong></summary>

```bash
claude mcp add covenant -- npx -y covenant-mcp
# or hosted:
claude mcp add --transport http covenant https://covenant-skill.onrender.com/mcp
```

</details>

<details>
<summary><strong>OpenAI Agents SDK</strong></summary>

```ts
import { Agent, hostedMcpTool } from "@openai/agents";

const agent = new Agent({
  name: "Covenant Agent",
  instructions: "Use COVENANT before any on-chain execution.",
  tools: [
    hostedMcpTool({
      serverLabel: "covenant",
      serverUrl: "https://covenant-skill.onrender.com/mcp",
      requireApproval: "never",
    }),
  ],
});
```

</details>

<details>
<summary><strong>Antigravity</strong></summary>

Same as Cursor — use `.cursor/mcp.json` from `npx covenant-mcp init`.

</details>

---

## Security Model

- User never shares private keys or seed phrases
- Agent never stores wallet secrets
- COVENANT is **not** a custodian
- `covenant_preflight` evaluates only — signing is separate
- Money movement requires **wallet approval** in browser
- Sessions and approvals persist in **Postgres** (production)
- LLMs **cannot** override deterministic `DENY`

Details: [`docs/SECURITY.md`](docs/SECURITY.md)

---

## FAQ

**Do I need API keys?**  
No for health, reputation, simulate, preflight, or hosted attestation.

**Why `covenant-mcp` not `@covenant/mcp`?**  
Public npm package is unscoped: `covenant-mcp`.

**Is the web UI required?**  
No. It's a demo for wallet connect/approve. Agents use MCP tools.

**MetaMask chain ID?**  
Must be **688689** (`0xa8231`). Delete any network saved as 688545.

---

## Documentation

| Doc | Description |
|---|---|
| [docs/README.md](docs/README.md) | Documentation index |
| [docs/JUDGE_QUICK_START.md](docs/JUDGE_QUICK_START.md) | 3-minute judge verification |
| [docs/proofs/PROOF_OF_EXECUTION.md](docs/proofs/PROOF_OF_EXECUTION.md) | Real on-chain proof |
| [docs/architecture/README.md](docs/architecture/README.md) | System architecture |
| [docs/MCP_REFERENCE.md](docs/MCP_REFERENCE.md) | Tool schemas |
| [AGENT_EXPERIENCE_AUDIT.md](AGENT_EXPERIENCE_AUDIT.md) | Onboarding audit |
| [AGENTS.md](AGENTS.md) | Agent skill manifest |

---

## Links

- **GitHub:** https://github.com/mohamedwael201193/COVENANT
- **npm:** https://www.npmjs.com/package/covenant-mcp
- **Skill API:** https://covenant-skill.onrender.com
- **Hosted MCP:** https://covenant-skill.onrender.com/mcp
- **Approval UI:** https://covenant-web-mu.vercel.app
