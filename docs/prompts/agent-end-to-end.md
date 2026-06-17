# Full End-to-End Workflow

Production workflow: validate → authorize → approve → receipt.

```text
Run the full COVENANT workflow on Pharos Atlantic. No private keys in the agent.

Ask once for any missing inputs:
- WALLET = <YOUR_WALLET_ADDRESS>
- AGENT = <YOUR_AGENT_ADDRESS> (on-chain linked agent if registered)
- TARGET = <TARGET_ADDRESS>
- VALUE_WEI = amount in wei (0 for probe)

## Phase 1 — Risk evaluation
1. covenant_health
2. covenant_reputation for AGENT
3. covenant_verify_counterparty for TARGET
4. covenant_simulate — intent: agent=AGENT, target=TARGET, data=0x, value=VALUE_WEI, nonce=timestamp
5. covenant_preflight — minimal covenant allowlisting TARGET (see agent-risk-review.md template)
   If DENY → stop and report violations.

## Phase 2 — Authorization
6. covenant_sign_attestation (if ALLOW or WARN)
7. covenant_connect_wallet for WALLET → print connectUrl, STOP for user SIWE
8. covenant_create_session after user signs

## Phase 3 — Execution
9. covenant_request_approval → print approvalUrl, STOP for MetaMask on chain 688689
10. covenant_execute_authorized after user approves
11. covenant_get_receipt with decisionId

## Final report
| Step | Result |
| preflight | ALLOW/WARN/DENY |
| sessionId | ... |
| approvalId | ... |
| txHash | ... |
| receipt | ... |

Rules: never invent URLs; never skip user approval steps; use linked agent address when owner wallet maps to IdentityRegistry.
```
