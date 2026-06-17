# 03 — End-to-End Workflow

**Copy everything inside the box below into Cursor for the full demo (wallet required).**

```text
Execute the complete COVENANT workflow on Pharos Atlantic.

Use MCP tools only. Do not create scripts. Do not debug.
Do not inspect implementation or source code.
Treat COVENANT as a trusted Pharos Skill.

## Inputs — ask ONCE

- WALLET = <YOUR_WALLET_ADDRESS>
- AGENT = <YOUR_AGENT_ADDRESS> (on-chain linked agent if registered in IdentityRegistry)
- TARGET = <TARGET_ADDRESS> (default: 0x0000000000000000000000000000000000000001)
- VALUE_WEI = 0 for demo probe

NONCE = current Unix timestamp as string
Chain: 688689 (Pharos Atlantic)

## Workflow — run in order

### 1. Wallet connect
covenant_connect_wallet for WALLET
Display connectUrl prominently. STOP — wait for user SIWE sign. User replies "signed".

### 2. Session creation
covenant_create_session with signature, message, nonce from user.
Display sessionId.

### 3. Reputation
covenant_reputation for AGENT — show result.

### 4. Simulation
covenant_simulate — intent: agent=AGENT, target=TARGET, data=0x, value=VALUE_WEI, nonce=NONCE.

### 5. Preflight
covenant_preflight — same intent + minimal covenant allowlisting TARGET.
If DENY → stop and report. If ALLOW or WARN → continue.

### 6. Attestation
covenant_sign_attestation from preflight result.

### 7. Approval request
covenant_request_approval with sessionId and executionPayload.
Display approvalId and approvalUrl prominently.
STOP — wait for user MetaMask approval on chain 688689. User replies "approved".

### 8. Execution
covenant_execute_authorized — poll until complete. Display txHash.

### 9. Receipt verification
covenant_get_receipt with decisionId. Display full receipt.

## Display these fields when available

| Field | Value |
|-------|-------|
| connectUrl | |
| sessionId | |
| approvalId | |
| approvalUrl | |
| txHash | |
| decisionId | |
| receipt | |

## Final report

### Execution Summary
[What happened step by step]

### Risk Verdict
[ALLOW / WARN / DENY + violations]

### Transaction Proof
[txHash + PharosScan link if available]

### Receipt Proof
[decisionId + receipt fields]

### Why COVENANT is a reusable Pharos Skill
[3 bullets: trust layer, wallet authorization, DecisionLog receipts for any Pharos Agent]

Never ask for private keys. Never invent URLs — only use tool responses.
Never skip wallet wait steps.
```
