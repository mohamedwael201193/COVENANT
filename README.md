# COVENANT

**Stripe for Agent Trust on Pharos.**

Covenant is a reusable MCP skill suite that lets AI agents evaluate risk, request wallet authorization, execute safely, produce receipts, and build Trust Capital without ever holding a user private key.

```text
Any AI agent
  -> Covenant skills
  -> deterministic preflight
  -> user approval URL
  -> wallet execution
  -> DecisionLog receipt
  -> Trust Capital update
```

Live API: `https://covenant-skill.onrender.com`  
Hosted MCP: `https://covenant-skill.onrender.com/mcp`  
Demo UI: `https://covenant-web-mu.vercel.app`

## 1. What Is Covenant?

Covenant is not a dashboard. It is a **trust and authorization rail** for autonomous agents.

Agents call Covenant before they touch money:

```text
covenant_reputation -> covenant_simulate -> covenant_preflight -> covenant_request_approval
```

The user approves in a wallet. Covenant records the outcome on Pharos.

## 2. Why Agents Need Covenant

Without Covenant:

```text
LLM judgment + hot key + no audit trail
```

With Covenant:

```text
deterministic policy + user wallet approval + on-chain receipt + reputation
```

Agents get a clear `ALLOW`, `WARN`, or `DENY`. Users keep control.

## 3. Skills Overview

### Skill: Trust Evaluation

Read an agent’s Trust Capital before execution.

```json
{ "tool": "covenant_reputation", "arguments": { "agent": "0xAgent" } }
```

### Skill: Counterparty Verification

Check a recipient or contract before sending value.

```json
{ "tool": "covenant_verify_counterparty", "arguments": { "address": "0xTarget" } }
```

### Skill: Transaction Preflight

Evaluate an on-chain intent with rules and simulation.

```json
{
  "tool": "covenant_preflight",
  "arguments": {
    "intent": {
      "agent": "0xAgent",
      "target": "0xTarget",
      "data": "0x",
      "value": "0",
      "nonce": "1"
    },
    "covenantHash": "0x...",
    "covenant": {
      "version": "1",
      "agent": "0xAgent",
      "owner": "0xOwner",
      "allowlist": ["0xTarget"],
      "denylist": [],
      "baseMaxValueWei": "1000000000000000000",
      "tierLimits": [{ "tier": 1, "maxValueWei": "1000000000000000000" }],
      "minCounterpartyTier": 0,
      "timeWindows": [],
      "requiredChecks": ["simulation"],
      "createdAt": "2026-06-17T00:00:00.000Z"
    }
  }
}
```

### Skill: Trust Capital

Every execution can become reputation evidence.

```json
{ "tool": "covenant_get_receipt", "arguments": { "decisionId": "1" } }
```

### Skill: Wallet Authorization

Create a SIWE session without exposing keys.

```json
{ "tool": "covenant_connect_wallet", "arguments": { "walletAddress": "0xUser" } }
```

### Skill: Execution Approval

Create a browser approval URL for user wallet execution.

```json
{
  "tool": "covenant_request_approval",
  "arguments": {
    "sessionId": "sess_...",
    "intentHash": "0x...",
    "verdict": "ALLOW",
    "executionPayload": {
      "intent": { "agent": "0xAgent", "target": "0xTarget", "data": "0x", "value": "0", "nonce": "1" },
      "covenantHash": "0x...",
      "attestation": { "deadline": "1781660000", "v": 27, "r": "0x...", "s": "0x..." }
    }
  }
}
```

## 4. Architecture

```text
MCP Client / Agent
  -> covenant-mcp stdio or hosted /mcp
  -> Skill API
  -> Postgres session + approval store
  -> Pharos contracts
     - GuardedExecutor
     - DecisionLog
     - ReputationRegistry
  -> Web approval UI
```

One source of truth: sessions and approvals persist in Postgres. Production approvals are never memory-only.

## 5. Trust Capital

Trust Capital is agent reputation on Pharos. Agents earn or lose trust based on audited execution history.

```bash
curl https://covenant-skill.onrender.com/api/reputation/0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3
```

## 6. Pharos Integration

Covenant is deployed on Pharos Atlantic testnet (`688689`) and uses live RPC reads by default.

```text
RPC: https://atlantic.dplabs-internal.com
Explorer: https://atlantic.pharosscan.xyz
```

## 7. Install In 2 Minutes

No secrets required for health, reputation, simulate, preflight, or counterparty verification.

```bash
npx -y covenant-mcp init
```

Verify:

```bash
npx -y covenant-mcp
```

Then ask your agent:

```text
Use Covenant and call covenant_health.
```

`init` creates `.env.covenant`, `.cursor/mcp.json.example`, and `.cursor/mcp.json` when no MCP config exists yet.

## 8. Cursor Setup

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

Hosted option:

```json
{
  "mcpServers": {
    "covenant": {
      "url": "https://covenant-skill.onrender.com/mcp"
    }
  }
}
```

## 9. Claude Desktop Setup

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

## 10. Claude Code Setup

Local stdio:

```bash
claude mcp add covenant -- npx -y covenant-mcp
```

Hosted:

```bash
claude mcp add --transport http covenant https://covenant-skill.onrender.com/mcp
```

## 11. OpenAI Agents Setup

```ts
import { Agent, hostedMcpTool } from "@openai/agents";

export const agent = new Agent({
  name: "Covenant Agent",
  instructions: "Use Covenant before on-chain execution.",
  tools: [
    hostedMcpTool({
      serverLabel: "covenant",
      serverUrl: "https://covenant-skill.onrender.com/mcp",
      requireApproval: "never"
    })
  ]
});
```

## 12. Antigravity Setup

Use the Cursor config above. Then ask:

```text
Use Covenant to check health, read reputation, simulate a zero-value call, and preflight it.
```

Expected:

```text
health ok
reputation returned
simulate returned
preflight ALLOW/WARN/DENY
```

## 13. Hosted MCP

Current hosted endpoint:

```text
https://covenant-skill.onrender.com/mcp
```

Production target:

```text
https://api.covenant.xyz/mcp
```

Test hosted MCP manually:

```bash
curl -s https://covenant-skill.onrender.com/mcp
node packages/skill/scripts/test-hosted-mcp.mjs
```

## 14. Wallet Authorization

```text
Agent -> covenant_connect_wallet -> connectUrl
User -> opens URL -> signs SIWE -> sessionId
Agent -> covenant_request_approval -> approvalUrl
User -> opens URL -> executes with wallet
```

No private key is shared with the agent, the server, or the UI.

## 15. Security Model

- User never shares private keys or seed phrases.
- Agent never stores wallet secrets.
- Covenant is not a custodian.
- `covenant_preflight` evaluates only; signing is separate.
- Money movement requires wallet approval.
- Production sessions and approvals persist in Postgres.
- LLMs cannot override deterministic `DENY`.

## 16. Tool Reference

Zero-setup tools:

```text
covenant_health
covenant_reputation
covenant_simulate
covenant_preflight
covenant_verify_counterparty
```

Wallet and approval tools:

```text
covenant_connect_wallet
covenant_create_session
covenant_request_approval
covenant_get_pending_approvals
covenant_execute_authorized
covenant_revoke_session
```

Execution and audit tools:

```text
covenant_sign_attestation
covenant_get_receipt
covenant_attest_outcome
```

Owner/oracle tools:

```text
covenant_register_identity
covenant_set_covenant
covenant_rotate_key
```

## 17. Skill Workflows

Risk review:

```text
covenant_health -> covenant_reputation -> covenant_simulate -> covenant_preflight
```

Send money:

```text
covenant_preflight -> covenant_sign_attestation -> covenant_request_approval -> user executes -> covenant_get_receipt
```

Counterparty check:

```text
covenant_verify_counterparty -> covenant_preflight
```

## 18. Example Prompts

Prompt library:

```text
docs/prompts/INSTALL_AGENT.md
docs/prompts/WALLET_SETUP.md
docs/prompts/SEND_TRANSACTION.md
docs/prompts/RISK_REVIEW.md
docs/prompts/COUNTERPARTY_CHECK.md
docs/prompts/agent-risk-review.md
docs/prompts/agent-send-money.md
docs/prompts/agent-preflight.md
docs/prompts/agent-counterparty-check.md
docs/prompts/agent-wallet-authorization.md
docs/prompts/agent-covenant-audit.md
```

Example:

```text
Use Covenant to preflight this Pharos transfer. If ALLOW, create an approval URL. Do not ask me for a private key.
```

## 19. FAQ

**Do I need GoPlus keys?**  
No. Public tools work without GoPlus. If keys are absent, GoPlus is skipped or reported as unavailable.

**Do I need `DEPLOYER_PRIVATE_KEY`?**  
No for public tools. Hosted attestation can sign ALLOW attestations.

**Why not `@covenant/mcp`?**  
The public npm package is currently unscoped: `covenant-mcp`.

## 20. Troubleshooting

Tool discovery:

```bash
npx -y covenant-mcp
```

Clean install:

```bash
mkdir covenant-test && cd covenant-test
npm install covenant-mcp
npx covenant-mcp init
```

Wallet flow:

```bash
node packages/skill/scripts/test-wallet-flow.mjs
```

Benchmark:

```bash
node scripts/benchmark-mcp.mjs
```

## 21. Live Contracts

```text
IdentityRegistry:   0x05545F026b75f03aE9Cf1eA8a8373473c94ed323
CovenantRegistry:   0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770
DecisionLog:        0x8A80D270dd7028536ecB6f92b04eec11F929d603
ReputationRegistry: 0x92b8815A17D85E45DB5Da9952764Ee2ce072A973
GuardedExecutor:    0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F
Attester:           0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3
```

## 22. Demo Links

```text
Skill API:  https://covenant-skill.onrender.com
Hosted MCP: https://covenant-skill.onrender.com/mcp
Web UI:     https://covenant-web-mu.vercel.app
GitHub:     https://github.com/mohamedwael201193/COVENANT
NPM:        https://www.npmjs.com/package/covenant-mcp
```
