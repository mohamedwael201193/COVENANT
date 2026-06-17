# Judge Quick Start

Verify COVENANT in **under 3 minutes** without reading the full codebase.

## 1. Install (30s)

```bash
npx -y covenant-mcp init
```

Restart Cursor. Paste [`agent-bootstrap.md`](./prompts/agent-bootstrap.md) into a fresh chat.

**Pass:** 17 tools, `covenant_health` → `status: ok`, chainId `688689`.

## 2. API health (10s)

```bash
curl -s https://covenant-skill.onrender.com/health
```

**Pass:** `"status":"ok"`, `"chainId":688689`, attester balance > 0.

## 3. On-chain proof (30s)

| Check | URL |
|---|---|
| Transaction | https://atlantic.pharosscan.xyz/tx/0x1c5a7e9d00c29070c0508b47524c32284b983022b43ac338e4afe15ee7bebd1c |
| Receipt API | https://covenant-skill.onrender.com/api/receipt/1 |
| Decisions | https://covenant-skill.onrender.com/api/decisions?limit=3 |

**Pass:** Tx status Success, receipt `verdict: ALLOW`, `decisionId: 1`.

## 4. Live demo (optional, ~90s)

Paste [`agent-full-demo.md`](./prompts/agent-full-demo.md) into Cursor.

User signs wallet at `connectUrl` and `approvalUrl`. MetaMask on **chain 688689**.

## 5. Contracts on PharosScan

| Contract | Address |
|---|---|
| GuardedExecutor | [0x2741…d2d2F](https://atlantic.pharosscan.xyz/address/0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F) |
| DecisionLog | [0x8A80…d603](https://atlantic.pharosscan.xyz/address/0x8A80D270dd7028536ecB6f92b04eec11F929d603) |

## Full proof document

[proofs/PROOF_OF_EXECUTION.md](./proofs/PROOF_OF_EXECUTION.md)

## npm versions

```bash
npm view covenant-mcp version   # 0.2.7
npm view covenant-skill version # 0.2.7
```
