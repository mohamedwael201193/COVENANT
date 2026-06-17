# Video Demo Prompt

**Optimized for screen recording.** Paste into a fresh Cursor chat.

```text
You are recording a COVENANT demo video for the Pharos Skill Hackathon.

Repository: https://github.com/mohamedwael201193/COVENANT
Package: covenant-mcp@0.2.7

Speak in short, clear sentences. Format output for screen capture — use tables, separators, and bold labels.

## Inputs (ask ONCE if not provided)

- WALLET = user's Pharos wallet address (ask: "What is your Pharos wallet address?")
- AGENT = on-chain linked agent for that wallet (if unknown, use WALLET and note setup may be needed on approval page)

If I already gave a wallet address in this chat, use it. Do not ask again.

Defaults for validation probes:
PROBE_TARGET = 0x0000000000000000000000000000000000000001
NONCE = current Unix timestamp

## Phase 1 — Install & discover (~15s)

1. npx -y covenant-mcp init
2. List all covenant_* tools → print: "✓ [N] tools discovered"
3. covenant_health → print chainId, status, latency ms

## Phase 2 — Validation (~20s)

4. covenant_reputation for AGENT → print tier, score, latency
5. covenant_simulate — zero-value intent to PROBE_TARGET → print success, latency
6. covenant_preflight — build minimal covenant (allowlist PROBE_TARGET, requiredChecks: ["simulation"]) → print:

   ══════════════════════════════════════
   PREFLIGHT VERDICT: [ALLOW|WARN|DENY]
   Violations: [list]
   intentHash: [hash]
   Latency: [ms]
   ══════════════════════════════════════

## Phase 3 — Wallet authorization (~30s)

7. covenant_connect_wallet for WALLET
8. Print prominently:

   ╔══════════════════════════════════════╗
   ║  USER ACTION — CONNECT WALLET      ║
   ║  connectUrl: [full URL]              ║
   ║  Chain: 688689 (Pharos Atlantic)     ║
   ╚══════════════════════════════════════╝

9. STOP. Wait for me to sign SIWE and reply DONE.
10. covenant_create_session → print sessionId

## Phase 4 — Approval & execution (~25s)

11. covenant_sign_attestation (if ALLOW or WARN)
12. covenant_request_approval → print:

    ╔══════════════════════════════════════╗
    ║  USER ACTION — APPROVE TRANSACTION   ║
    ║  approvalUrl: [full URL]             ║
    ║  MetaMask chain: 688689              ║
    ╚══════════════════════════════════════╝

13. STOP. Wait for me to approve in MetaMask and reply DONE.

## Phase 5 — Receipt (~10s)

14. covenant_execute_authorized or poll approval status
15. covenant_get_receipt → print:

    ╔══════════════════════════════════════╗
    ║  EXECUTION COMPLETE                  ║
    ║  txHash:      [hash]                 ║
    ║  decisionId:  [id]                   ║
    ║  verdict:     [from receipt]         ║
    ╚══════════════════════════════════════╝

## Summary table (always print at end)

| Step | Tool | Result | Latency |
|------|------|--------|---------|
| ... | ... | ... | ...ms |

## Rules

- Never ask for private keys or seed phrases.
- Never invent URLs — only tool responses.
- Never skip wallet wait steps — pause for real user approval.
- MetaMask MUST be on chain 688689 (not 688545).
- Use linked agent address in intents when owner wallet maps to a registered agent.
```
