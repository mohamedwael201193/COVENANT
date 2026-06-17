# Judge & Demo Quick Start

> **For hackathon judges and demo reviewers.** Developers should start with the [README](../README.md).

Verify COVENANT in under 60 seconds without a wallet, or run a full wallet demo for recording.

---

## Judge path (< 60s, no wallet)

| Step | Action |
|---|---|
| 1 | `npx -y covenant-mcp init` |
| 2 | Restart Cursor |
| 3 | Paste [`docs/prompts/judge-demo.md`](./prompts/judge-demo.md) |
| 4 | Verify agent report: **17 tools**, `health: ok`, `chainId: 688689` |

**Pass criteria:** Tools discovered, health OK, reputation returned, simulate success, preflight verdict returned.

---

## Video demo path (~90s, with wallet)

| Step | Action |
|---|---|
| 1 | Open fresh Cursor chat |
| 2 | Paste [`docs/prompts/video-demo.md`](./prompts/video-demo.md) |
| 3 | Provide wallet when asked |
| 4 | Approve at `connectUrl` and `approvalUrl` |
| 5 | Show `txHash` + `covenant_get_receipt` |

MetaMask must be on chain **688689**.

---

## Proof verification

| Check | Command / URL |
|---|---|
| Proof document | [proofs/PROOF_OF_EXECUTION.md](./proofs/PROOF_OF_EXECUTION.md) |
| API health | `curl -s https://covenant-skill.onrender.com/health` |
| Receipt API | `curl -s https://covenant-skill.onrender.com/api/receipt/1` |
| On-chain tx | https://atlantic.pharosscan.xyz/tx/0x1c5a7e9d00c29070c0508b47524c32284b983022b43ac338e4afe15ee7bebd1c |
| npm version | `npm view covenant-mcp version` → `0.2.7` |

**Pass:** Tx status Success, receipt `verdict: ALLOW`, `decisionId: 1`.

---

## Demo addresses (proof only)

These addresses appear only in proof documentation. **Do not use in prompts or workflows.**

| Role | Address |
|---|---|
| Owner wallet | `0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3` |
| Linked agent | `0xfBb4A658f89736eD40CAAAD735bcedb3272C4600` |
| Proof txHash | `0x1c5a7e9d00c29070c0508b47524c32284b983022b43ac338e4afe15ee7bebd1c` |

For validation without a wallet, [`judge-demo.md`](./prompts/judge-demo.md) uses the public IdentityRegistry contract as a probe.

---

## Contracts (PharosScan)

| Contract | Link |
|---|---|
| GuardedExecutor | [0x2741…d2d2F](https://atlantic.pharosscan.xyz/address/0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F) |
| DecisionLog | [0x8A80…d603](https://atlantic.pharosscan.xyz/address/0x8A80D270dd7028536ecB6f92b04eec11F929d603) |

---

## Submission docs

| Doc | Purpose |
|---|---|
| [submission/DEMO_GUIDE.md](./submission/DEMO_GUIDE.md) | Demo walkthrough |
| [submission/JUDGE_TESTING_GUIDE.md](./submission/JUDGE_TESTING_GUIDE.md) | Extended judge guide |
| [submission/SUBMISSION_CHECKLIST.md](./submission/SUBMISSION_CHECKLIST.md) | Submission checklist |
