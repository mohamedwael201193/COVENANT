# COVENANT

**Trust, authorization, and guarded execution for AI agents on Pharos.**

[![npm](https://img.shields.io/npm/v/covenant-mcp)](https://www.npmjs.com/package/covenant-mcp)
[![MCP tools](https://img.shields.io/badge/tools-17-blue)](docs/MCP_REFERENCE.md)
[![Chain](https://img.shields.io/badge/chain-Pharos_Atlantic-688689)](https://atlantic.pharosscan.xyz)

COVENANT is an MCP server that lets AI agents **evaluate risk**, **request wallet approval**, and **execute on-chain actions** with verifiable receipts — without holding private keys.

```text
Agent  →  COVENANT MCP  →  Risk Evaluation  →  Wallet Approval  →  Guarded Execution  →  Receipt
```

| Capability | What it does |
|---|---|
| **Trust Capital** | On-chain reputation tiers limit what an agent can do |
| **Risk evaluation** | Deterministic `ALLOW` / `WARN` / `DENY` before any tx |
| **Wallet authorization** | SIWE sessions — user signs in browser, not in the agent |
| **Guarded execution** | `GuardedExecutor` verifies attestation on-chain |
| **Receipts** | Immutable `DecisionLog` entries for audit |

**Why you need it:** LLMs can call tools but cannot safely move value. COVENANT is the authorization rail between agent intent and user custody.

| Resource | URL |
|---|---|
| npm | `covenant-mcp` · `npx -y covenant-mcp init` |
| Hosted MCP | `https://covenant-skill.onrender.com/mcp` |
| Skill API | `https://covenant-skill.onrender.com` |
| Approval UI (demo) | `https://covenant-web-mu.vercel.app` |

---

## Installation

### Option A — stdio (recommended)

```bash
npx -y covenant-mcp init
```

Creates:

| File | Purpose |
|---|---|
| `.cursor/mcp.json` | MCP server config (no secrets required) |
| `.env.covenant` | Optional env template for advanced setup |
| `.cursor/mcp.json.example` | Reference copy |

Restart your MCP client after init.

### Option B — hosted MCP (no local Node)

Add to your MCP client config:

```json
{
  "mcpServers": {
    "covenant": {
      "url": "https://covenant-skill.onrender.com/mcp"
    }
  }
}
```

### Option C — global install

```bash
npm install -g covenant-mcp
covenant-mcp
```

### Optional environment variables

| Variable | Required | Purpose |
|---|---|---|
| `PHAROS_RPC_URL` | No | Defaults to Atlantic RPC |
| `PREFLIGHT_LLM_ENABLED` | No | Set `false` for faster preflight (recommended) |
| `GOPLUS_APP_KEY` / `GOPLUS_APP_SECRET` | No | Enables counterparty risk signals |
| `DEPLOYER_PRIVATE_KEY` | No | Only for oracle/owner tools |

See [docs/skill/INSTALL.md](docs/skill/INSTALL.md) for secrets and monorepo development.

---

## Quick Start

**Fastest path** — install, restart MCP client, then ask your agent:

```text
Call covenant_health, then covenant_reputation for agent <YOUR_AGENT_ADDRESS>,
then covenant_simulate with a zero-value probe to <TARGET_ADDRESS>.
Report results in a table.
```

**Expected:** `health.status = ok`, `chainId = 688689`, reputation tier returned, simulation succeeds.

### Minimal MCP config

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

---

## Wallet Authorization Flow

COVENANT never holds user keys. Money moves only after explicit wallet approval.

```text
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ 1. SIWE     │ ──► │ 2. Session   │ ──► │ 3. Approval │ ──► │ 4. Receipt   │
│ connectUrl  │     │ sessionId    │     │ approvalUrl │     │ decisionId   │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
```

| Step | Tool | Who acts | Output |
|---|---|---|---|
| **1. Connect** | `covenant_connect_wallet` | Agent calls | `connectUrl`, SIWE `nonce` |
| **2. Sign in** | User opens URL, signs | User (MetaMask) | Wallet signature |
| **3. Session** | `covenant_create_session` | Agent calls | `sessionId`, permissions |
| **4. Preflight** | `covenant_preflight` | Agent calls | `ALLOW` / `WARN` / `DENY` |
| **5. Attest** | `covenant_sign_attestation` | Hosted oracle | EIP-712 signature |
| **6. Approve** | `covenant_request_approval` | Agent calls | `approvalUrl` |
| **7. Execute** | User opens URL, signs tx | User (MetaMask) | `txHash` |
| **8. Receipt** | `covenant_get_receipt` | Agent calls | DecisionLog entry |

**Important:** Use your on-chain **linked agent** address in intents when your wallet is registered in `IdentityRegistry` — not the owner wallet address.

**Chain:** MetaMask must be on Pharos Atlantic **688689** (`0xa8231`).

---

## MCP Configuration

### Cursor / Antigravity

```bash
npx -y covenant-mcp init
```

Restart IDE. Config lives in `.cursor/mcp.json`.

### Claude Desktop

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

### Claude Code

```bash
claude mcp add covenant -- npx -y covenant-mcp
# or hosted:
claude mcp add --transport http covenant https://covenant-skill.onrender.com/mcp
```

### OpenAI Agents SDK

```typescript
import { Agent, hostedMcpTool } from "@openai/agents";

const agent = new Agent({
  name: "Trading Agent",
  instructions: "Use COVENANT before any on-chain execution. Never ask for private keys.",
  tools: [
    hostedMcpTool({
      serverLabel: "covenant",
      serverUrl: "https://covenant-skill.onrender.com/mcp",
      requireApproval: "never",
    }),
  ],
});
```

More clients: [docs/skill/INTEGRATIONS.md](docs/skill/INTEGRATIONS.md)

---

## Tool Reference

17 tools, all prefixed `covenant_*`. Full schemas: [docs/MCP_REFERENCE.md](docs/MCP_REFERENCE.md)

### Zero-setup (no secrets)

| Tool | Input | Output | Example |
|---|---|---|---|
| `covenant_health` | — | `status`, `chainId`, attester | Readiness check |
| `covenant_reputation` | `agent` | `score`, `tier` | Trust Capital lookup |
| `covenant_simulate` | `intent` | `success`, gas | Dry-run calldata |
| `covenant_preflight` | `intent`, `covenant`, `covenantHash` | `verdict`, `violations`, `intentHash` | Policy + simulation |
| `covenant_verify_counterparty` | `address` | GoPlus risk signals | Recipient check |
| `covenant_get_receipt` | `decisionId` | DecisionLog entry | Post-execution audit |
| `covenant_sign_attestation` | preflight result | EIP-712 signature | Hosted oracle sign |

### Wallet & approval

| Tool | Input | Output |
|---|---|---|
| `covenant_connect_wallet` | `address` | `connectUrl`, `nonce`, SIWE message |
| `covenant_create_session` | `signature`, `message`, `nonce` | `sessionId`, permissions |
| `covenant_request_approval` | `sessionId`, `executionPayload` | `approvalUrl`, `approvalId` |
| `covenant_get_pending_approvals` | `sessionId` | Pending approval list |
| `covenant_execute_authorized` | `approvalId` | Execution status |
| `covenant_revoke_session` | `sessionId` | Session revoked |

### Owner / oracle (requires `DEPLOYER_PRIVATE_KEY`)

| Tool | Purpose |
|---|---|
| `covenant_register_identity` | Register agent on `IdentityRegistry` |
| `covenant_set_covenant` | Publish covenant hash on-chain |
| `covenant_rotate_key` | Rotate agent signing key |
| `covenant_attest_outcome` | Write reputation outcome |

### Intent object (shared shape)

```json
{
  "agent": "<YOUR_AGENT_ADDRESS>",
  "target": "<TARGET_ADDRESS>",
  "data": "0x",
  "value": "0",
  "nonce": "1718660001"
}
```

### Preflight verdicts

| Verdict | Meaning | Next step |
|---|---|---|
| `ALLOW` | Passed all checks | Sign attestation → request approval |
| `WARN` | Passed with warnings | Explain to user → proceed if accepted |
| `DENY` | Policy violation | **Stop.** Do not request approval |

---

## Example Workflows

### Reputation check

```text
covenant_health → covenant_reputation({ agent: "<YOUR_AGENT_ADDRESS>" })
```

### Risk review before payment

```text
covenant_verify_counterparty → covenant_simulate → covenant_preflight
```

Prompt: [docs/prompts/agent-risk-review.md](docs/prompts/agent-risk-review.md)

### Wallet authorization

```text
covenant_connect_wallet → [user signs SIWE] → covenant_create_session
```

Prompt: [docs/prompts/agent-wallet-authorization.md](docs/prompts/agent-wallet-authorization.md)

### Transaction approval

```text
covenant_sign_attestation → covenant_request_approval → [user approves] → covenant_execute_authorized
```

Prompt: [docs/prompts/agent-request-approval.md](docs/prompts/agent-request-approval.md)

### Receipt verification

```text
covenant_get_receipt({ decisionId: "42" })
```

More examples: [docs/skill/EXAMPLES.md](docs/skill/EXAMPLES.md)

---

## Agent Installation Prompts

Copy-paste these into Cursor, Claude Code, Antigravity, or any MCP agent.

| Task | Prompt file |
|---|---|
| Install COVENANT | [agent-install.md](docs/prompts/agent-install.md) |
| Validate installation | [agent-bootstrap.md](docs/prompts/agent-bootstrap.md) |
| Health check | [agent-health-check.md](docs/prompts/agent-health-check.md) |
| Reputation review | [agent-reputation-review.md](docs/prompts/agent-reputation-review.md) |
| Risk review | [agent-risk-review.md](docs/prompts/agent-risk-review.md) |
| Connect wallet | [agent-wallet-authorization.md](docs/prompts/agent-wallet-authorization.md) |
| Request approval | [agent-request-approval.md](docs/prompts/agent-request-approval.md) |
| Full end-to-end | [agent-end-to-end.md](docs/prompts/agent-end-to-end.md) |

All prompts use placeholders — `<YOUR_WALLET_ADDRESS>`, `<YOUR_AGENT_ADDRESS>`, `<TARGET_ADDRESS>` — never hardcoded wallets.

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

## Security Model

| Principle | Detail |
|---|---|
| No custodial keys | Agents never receive private keys or seed phrases |
| Deterministic policy | `covenant_preflight` verdicts are rule-based; LLMs explain only |
| Wallet-native approval | Execution requires user signature in browser wallet |
| On-chain verification | `GuardedExecutor` validates EIP-712 attestation before execution |
| Immutable audit | Every decision logged to `DecisionLog` |

COVENANT is **not** a wallet, custodian, or off-chain auth provider.

Details: [docs/SECURITY.md](docs/SECURITY.md)

---

## FAQ

**Do I need API keys?**  
No for health, reputation, simulate, preflight, or hosted attestation. GoPlus keys are optional.

**Do I need the web UI?**  
No. The approval UI is a convenience demo. Agents use MCP tools and return URLs to the user.

**Why `covenant-mcp` not a scoped package?**  
The published npm package is unscoped: [`covenant-mcp`](https://www.npmjs.com/package/covenant-mcp).

**What chain ID does MetaMask need?**  
**688689** (`0xa8231`). Remove any saved network using 688545.

**Can I use COVENANT with other Pharos skills?**  
Yes. Call COVENANT before any skill that moves value. See [docs/skill/INTEGRATIONS.md](docs/skill/INTEGRATIONS.md).

**Where is the full tool schema?**  
[docs/MCP_REFERENCE.md](docs/MCP_REFERENCE.md) · [docs/API_REFERENCE.md](docs/API_REFERENCE.md)

---

## Documentation

| Doc | Description |
|---|---|
| [docs/README.md](docs/README.md) | Documentation index |
| [docs/DOCUMENTATION_MAP.md](docs/DOCUMENTATION_MAP.md) | Full hierarchy map |
| [docs/MCP_REFERENCE.md](docs/MCP_REFERENCE.md) | Tool schemas |
| [docs/skill/EXAMPLES.md](docs/skill/EXAMPLES.md) | Workflow examples |
| [docs/architecture/README.md](docs/architecture/README.md) | System design |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common errors |
| [AGENTS.md](AGENTS.md) | Agent skill manifest |

---

## Links

- **GitHub:** https://github.com/mohamedwael201193/COVENANT
- **npm:** https://www.npmjs.com/package/covenant-mcp
- **Skill API:** https://covenant-skill.onrender.com
- **Hosted MCP:** https://covenant-skill.onrender.com/mcp
