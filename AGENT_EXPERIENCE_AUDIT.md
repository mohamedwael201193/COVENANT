# COVENANT Zero-Friction Agent Experience Audit

Date: 2026-06-17

Perspective tested:

- Brand-new Cursor user
- Claude Code user
- Antigravity-style MCP user
- OpenAI Agents SDK developer
- Pharos hackathon judge

## Executive Summary

Covenant is directionally strong because it solves a harder problem than most Pharos skills: agents can evaluate trust, request wallet approval, execute through user custody, and retrieve on-chain receipts. The main friction was not missing core capability. It was first-run polish: brittle default RPC, a manual Cursor config copy step, raw RPC error payloads, and performance wasted on gas/trace calls.

Critical issues found in this audit were fixed in source:

- Default RPC changed to the official Pharos Atlantic endpoint.
- `npx covenant-mcp init` now creates `.cursor/mcp.json` directly when safe.
- RPC failures are structured and actionable.
- `covenant_health` description now matches its zero-RPC readiness behavior.
- `covenant_simulate` is fast by default; gas estimation is opt-in.
- Preflight reputation reads are bounded so one slow RPC does not block the whole decision path.
- Required copy-paste prompt files were added.

## Scores

| Area | Score | Notes |
|---|---:|---|
| Installation Score | 9/10 | `npm install covenant-mcp@0.2.6` worked cleanly from an isolated temp directory and created active Cursor MCP config automatically. |
| Tool Discovery Score | 8.5/10 | 17 tools discovered immediately. Descriptions now include clearer workflow order and token-sending guidance. |
| Documentation Score | 9/10 | README is skill-first and includes copy-paste setup. Added exact agent prompts. |
| Wallet UX Score | 7.5/10 | Session/approval URL flow is clear; full real wallet tx proof still requires deployed `0.2.5` and manual wallet signing. |
| Performance Score | 8/10 | Startup, health, simulate, and preflight targets met after fixes. Standalone reputation remains public-RPC bound. |
| Judge Score | 9/10 | Strong originality, Pharos alignment, composability, and AI-agent usefulness. Remaining proof gap is end-to-end deployed wallet execution evidence. |

## Clean Machine Test

Environment:

```text
Node: v24.12.0
npm: 11.6.2
Package tested: covenant-mcp@0.2.6 from npm
Install directory: isolated temp project
npm cache: isolated empty temp cache
Local repo source: not used
```

Commands executed:

```bash
npm install covenant-mcp@0.2.6 --cache <empty-temp-cache> --prefer-online --no-audit --no-fund
npm list covenant-mcp --depth=0
npx --cache <empty-temp-cache> covenant-mcp init
```

Observed:

```text
Install time: ~16.9s
Packages installed: 166
Installed version: covenant-mcp@0.2.6
Init created: .env.covenant
Init created: .cursor/mcp.json.example
Init created: .cursor/mcp.json
```

Friction found:

1. `init` previously wrote only `.cursor/mcp.json.example` and asked user to copy it.
2. Default RPC `atlantic-rpc.pharosnetwork.xyz` failed DNS from the clean environment.
3. MCP tool calls returned raw RPC failure text that looked like contract failure.
4. `covenant_simulate` made extra gas/trace RPC calls by default.

Fixes implemented:

1. `init` now creates `.cursor/mcp.json` if it does not already exist.
2. Default RPC is now `https://atlantic.dplabs-internal.com`.
3. RPC failures now return structured `rpc_unavailable` style responses.
4. Gas estimation is now opt-in via `includeGasEstimate: true`.

## Tool Discovery Test

Clean MCP discovery found 17 tools.

First tools seen by the agent:

```text
covenant_health
covenant_reputation
covenant_preflight
covenant_simulate
covenant_verify_counterparty
covenant_get_receipt
covenant_sign_attestation
covenant_connect_wallet
```

Assessment:

- Agent can understand Covenant is a trust and authorization layer.
- Agent can infer the normal sequence: health, reputation, counterparty, simulate, preflight, attestation, approval, receipt.
- Tool descriptions now explicitly guide the "Should I send tokens to X?" path.

Remaining friction:

- `covenant_preflight` requires a full covenant object. This is correct but verbose. Future improvement: add a helper prompt or tool that builds a minimal covenant template from agent/target/value.

## Antigravity-Style Flow Audit

Required zero-secret tools:

| Tool | Result |
|---|---|
| `covenant_health` | Works immediately, zero RPC. |
| `covenant_reputation` | Works when public RPC is reachable; now returns structured unavailable state on RPC failure. |
| `covenant_simulate` | Works faster after gas estimation became opt-in. |
| `covenant_preflight` | Works and is now bounded against slow reputation reads. |
| `covenant_verify_counterparty` | Works without keys by returning a clear skipped/unavailable state. |

Wallet/session/approval flow:

| Step | Status |
|---|---|
| `covenant_connect_wallet` | Returns SIWE message and `connectUrl`. |
| `covenant_create_session` | Requires real wallet signature. |
| `covenant_request_approval` | Requires valid sessionId. |
| Approval page execution | Requires deployed web/API and real wallet. |
| Receipt | Requires real DecisionLog id after execution. |

Published `0.2.6` smoke result:

```text
toolCount: 17
covenant_health: ok
covenant_simulate: success true for zero-value EOA-style call
covenant_preflight: WARN when reputation timeout warning is present
```

Remaining blocker:

- Full real tx proof cannot be completed non-interactively. It requires a browser wallet signature and deployed backend/web serving the latest code.

## Agent Autonomy Test

Prompt:

```text
Should I send 10 tokens to address X?
```

Expected Covenant-guided path:

```text
covenant_health
-> covenant_reputation
-> covenant_verify_counterparty
-> covenant_simulate
-> covenant_preflight
-> covenant_sign_attestation
-> covenant_request_approval
```

Result after fixes:

- Server instructions now explicitly include this sequence.
- Tool descriptions say not to use reputation or simulation as authorization.
- Approval tool says to return the `approvalUrl` to the user.
- Private key/seed phrase warnings are present in docs and prompts.

## README Audit

Can a user install from README?

Yes:

```bash
npx -y covenant-mcp init
```

Can they run and discover?

Yes, with MCP client restart.

Can they connect wallet and create session?

Yes, conceptually. README includes the flow and tool names. Real signing happens in the web UI.

Can they approve transaction and retrieve receipt?

Mostly. README explains the flow. Final proof still depends on deployment and wallet signing.

Fixes added:

- README now states `init` creates `.cursor/mcp.json`.
- Prompt library list includes exact copy-paste files.
- RPC endpoint updated to official Pharos Atlantic endpoint.

## Copy-Paste Prompt Library

Added:

```text
docs/prompts/INSTALL_AGENT.md
docs/prompts/WALLET_SETUP.md
docs/prompts/SEND_TRANSACTION.md
docs/prompts/RISK_REVIEW.md
docs/prompts/COUNTERPARTY_CHECK.md
```

Purpose:

- A user can provide only the GitHub URL and one prompt to an AI agent.
- The agent can install, configure MCP, verify tools, and run a safe workflow.

## GitHub-First Experience

Target user input:

```text
GitHub: https://github.com/mohamedwael201193/COVENANT
Prompt: docs/prompts/INSTALL_AGENT.md
```

Expected agent behavior:

```text
clone/read README
install public package with npx
run covenant-mcp init
verify MCP config
call covenant_health
call covenant_reputation
call covenant_simulate
call covenant_preflight
```

Implemented support:

- README has install, client setup, hosted MCP, tool reference, and prompts.
- `INSTALL_AGENT.md` contains the full copy-paste prompt.
- `init` now creates usable Cursor config directly.

## Performance Audit

Latest local benchmark after fixes:

| Metric | Result | Target | Status |
|---|---:|---:|---|
| startup | 379ms | <500ms | Pass |
| health | 6ms | <1000ms | Pass |
| reputation | 1302ms | <500ms | Miss |
| simulate | 372ms | <1500ms | Pass |
| preflight | 1577ms | <2000ms | Pass |

Remaining performance issue:

- `covenant_reputation` is a cold public RPC contract read. It should remain live/correct, so the fix is not to fake it. Future improvement: hosted indexed cache with response metadata like `source: "indexer"` and `freshnessSeconds`.

## Hackathon Judge Audit

Rubric alignment:

| Criterion | Assessment |
|---|---|
| Originality | Strong: trust and approval rail for agent actions, not another read-only dashboard. |
| Technical quality | Strong: MCP, Pharos contracts, DecisionLog receipts, GuardedExecutor, SIWE sessions. |
| Completeness | Strong but needs final deployed wallet proof after latest release. |
| Usability | Improved: one-command init, zero-secret tools, hosted MCP path. |
| Reusability | Very strong: any Pharos skill can call Covenant before moving value. |
| Composability | Very strong: reputation, simulation, preflight, approval, receipt compose cleanly. |
| Documentation | Strong after README/prompt work. |
| Pharos alignment | Strong: Pharos Atlantic contracts and Trust Capital. |
| AI-agent usefulness | Strong: deterministic verdicts and approval URLs solve a real agent problem. |

Competitive landscape summary:

- Many submissions focus on wallet analytics, NFT checks, transaction debugging, RWA analysis, or read-only safety reports.
- Covenant’s advantage is that it can wrap those skills before execution.
- Covenant should be positioned as the reusable trust and wallet authorization layer for the Pharos agent economy.

No competitor names should be used in public docs.

## Critical Issues

### Fixed: Brittle Default RPC

Problem:

Default endpoint failed DNS in clean test.

Root cause:

Package used a non-official endpoint as primary.

Fix:

Default changed to official Pharos Atlantic RPC:

```text
https://atlantic.dplabs-internal.com
```

### Fixed: Manual MCP Config Copy

Problem:

`init` created only `.cursor/mcp.json.example`.

Root cause:

The script avoided writing active config.

Fix:

`init` now creates `.cursor/mcp.json` if absent and leaves existing config untouched.

### Fixed: Confusing RPC Errors

Problem:

RPC failures looked like contract reverts or raw stack text.

Root cause:

Simulation and reputation passed low-level errors through directly.

Fix:

RPC failures now produce structured, actionable messages.

### Fixed: Unnecessary Simulation Latency

Problem:

Simulation called gas estimation and debug tracing by default.

Root cause:

Debug behavior was bundled into the fast path.

Fix:

Gas estimation is opt-in. Trace probing is disabled unless `COVENANT_DEBUG_TRACE_ENABLED=true`.

### Fixed: Warning Violations Did Not Downgrade ALLOW

Problem:

A successful zero-value preflight could include a warning violation but still return `ALLOW`.

Root cause:

Preflight merged rule verdicts before adding non-rule warning violations such as reputation timeout.

Fix:

Any warning violation now downgrades `ALLOW` to `WARN`. Published `0.2.6` verified this behavior.

## Medium Issues

- Standalone reputation read is still slower than target on public RPC.
- Full approval execution proof requires browser wallet and deployed latest API/UI.
- README is strong but long; npm README should remain the shortest fast path.
- Install still pulls 166 packages; future dependency trimming could improve first install.

## Minor Issues

- npm publish emits package normalization warnings.
- Web bundle is over 500KB after minification.
- Hosted MCP endpoint should move from Render URL to `https://api.covenant.xyz/mcp`.

## Final Status

A brand-new agent can now:

```text
install Covenant
configure MCP
discover tools
understand tool order
run health
run simulation
run preflight
start wallet authorization
request approval with a valid session
```

Not yet fully proven in this session:

```text
real wallet session signature
real approval execution tx hash
real DecisionLog receipt id
```
