# covenant-mcp

**Stripe + OAuth for AI Agents** on [Pharos Atlantic](https://pharosnetwork.xyz) (chainId `688689`).

Zero-setup preflight. Wallet sessions. Human approvals. No private keys in agents.

```bash
npx -y covenant-mcp
```

---

## 1. What is COVENANT?

COVENANT is the **trust rail** autonomous agents call before moving funds or executing on-chain. It combines:

- **Deterministic policy** (rules + simulation)
- **Trust Capital** reputation on Pharos
- **Signed attestations** for GuardedExecutor
- **SIWE sessions** + **approval URLs** (user signs in their wallet)

COVENANT is **not** a custodian. It never holds user private keys.

---

## 2. Why agents need COVENANT

| Without COVENANT | With COVENANT |
|---|---|
| Agent holds hot wallet key | User wallet + session |
| LLM decides transfers | Deterministic ALLOW/DENY |
| No audit trail | DecisionLog receipts |
| No reputation | Trust Capital tiers |

---

## 3. Quick Start (60 seconds)

```bash
npx -y covenant-mcp init
```

**Minimal MCP config** (no secrets required for read tools + preflight):

```json
{
  "mcpServers": {
    "covenant": {
      "command": "npx",
      "args": ["-y", "covenant-mcp"],
      "env": {
        "PREFLIGHT_LLM_ENABLED": "false"
      }
    }
  }
}
```

Verify: ask your agent to call `covenant_health`.

---

## 4. Agent install matrix

| Client | Config |
|---|---|
| **Cursor** | [config/cursor.mcp.json](./config/cursor.mcp.json) |
| **Claude Desktop** | [config/claude-desktop.mcp.json](./config/claude-desktop.mcp.json) |
| **Claude Code** | [config/claude-code.mcp.json](./config/claude-code.mcp.json) |
| **OpenAI Agents** | [config/openai-agents.example.ts](./config/openai-agents.example.ts) |
| **Antigravity** | Same as Cursor — use `covenant-mcp` not `@covenant/mcp` |

---

## 5. Zero-setup tools (no keys, no API secrets)

| Tool | Purpose |
|---|---|
| `covenant_health` | RPC + chain probe |
| `covenant_reputation` | Trust Capital tier |
| `covenant_simulate` | eth_call / gas |
| `covenant_preflight` | ALLOW/WARN/DENY evaluation |

Optional hosted attestation (no local attester key):

| Tool | Purpose |
|---|---|
| `covenant_sign_attestation` | Uses `https://covenant-skill.onrender.com` by default |

---

## 6. Wallet flow (no private keys)

```
covenant_connect_wallet
  → user signs SIWE message
covenant_create_session
  → sessionId (7–90 days)
covenant_preflight
  → ALLOW
covenant_sign_attestation
  → signed attestation (hosted)
covenant_request_approval
  → approvalUrl
User opens URL → wallet popup → signs
covenant_execute_authorized
covenant_get_receipt
```

Prompt library: [docs/prompts/](../../docs/prompts/)

---

## 7. Tool reference (17 tools)

**Public:** health, reputation, simulate, preflight, verify_counterparty, sign_attestation, connect_wallet, create_session, request_approval, get_pending_approvals, execute_authorized, revoke_session, get_receipt

**Privileged (oracle/owner only):** register_identity, set_covenant, rotate_key, attest_outcome

Full schemas: [docs/MCP_REFERENCE.md](../../docs/MCP_REFERENCE.md)

---

## 8. Hosted MCP + API (no local install)

Remote MCP endpoint:

```text
https://covenant-skill.onrender.com/mcp
```

Cursor / Claude remote config:

```json
{
  "mcpServers": {
    "covenant": {
      "url": "https://covenant-skill.onrender.com/mcp"
    }
  }
}
```

| Endpoint | Purpose |
|---|---|
| `POST /api/preflight/evaluate` | Secret-free evaluation |
| `POST /api/attest` | Hosted attestation signing |
| `GET /api/reputation/:agent` | Trust Capital |

Base: `https://covenant-skill.onrender.com`

Set `COVENANT_API_URL` to override.

---

## 9. Security model

- LLM **cannot** ALLOW — only deterministic engine
- User **never** shares seed phrase with agent
- Sessions are revocable + expiring
- Approvals require browser wallet signature
- Attester key stays on hosted skill or operator env — not in agent chat

---

## 10. FAQ

**Q: `npx @covenant/mcp` 404?**  
A: Use `npx covenant-mcp` (published unscoped). `@covenant` npm org requires separate access.

**Q: preflight needs GoPlus?**  
A: v0.2+ skips GoPlus when no keys; returns WARN with `GOPLUS_SKIPPED`.

**Q: How to sign ALLOW without DEPLOYER_PRIVATE_KEY?**  
A: `covenant_sign_attestation` uses hosted Render API by default.

---

## 11. Live contracts (Pharos Atlantic)

| Contract | Address |
|---|---|
| GuardedExecutor | `0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F` |
| ReputationRegistry | `0x92b8815A17D85E45DB5Da9952764Ee2ce072A973` |
| DecisionLog | `0x8A80D270dd7028536ecB6f92b04eec11F929d603` |

Dashboard demo: https://covenant-web-mu.vercel.app

---

## 12. Troubleshooting

| Issue | Fix |
|---|---|
| Slow preflight | `PREFLIGHT_LLM_ENABLED=false` |
| Tool list empty | Restart MCP client |
| Attestation fails | Check hosted API or set attester env on operator side |

Benchmark: `node scripts/benchmark-mcp.mjs` (from repo root, skill package for SDK)

---

MIT · [GitHub](https://github.com/mohamedwael201193/COVENANT)
