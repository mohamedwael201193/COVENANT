<aside>
🏗️

**What this is.** A production build plan — not a concept, whitepaper, or vision doc. It merges three of your concepts into **one unified Skill**: the **Covenant** credible-commitment loop, **NEXUM's Trust Capital** (accumulating, slashable economic standing), and **AEGIS's Execution Certification** (pre-execution simulation → signed attestation → on-chain-enforced execution). Everything below is scoped to what can be built, demonstrated, tested, and security-scanned **today**. Anything that can't be is explicitly cut in Section 2.

</aside>

<aside>
⚠️

**Validation honesty (read before building).** I verified these live and you must re-confirm the exact RPC string in the dashboard before deploy:

- **Pharos Atlantic Testnet:** chainId **688689** (`0xa8231`), native gas token **PHRS** (the testnet token is PHRS — *not* PROS; PROS is the hackathon reward/ecosystem token). Explorers: `atlantic.pharosscan.xyz`, `pharos-testnet.socialscan.io`. Docs live at **`docs.pharos.xyz`** (note: `.pharos.xyz`, not `.pharosnetwork.xyz`).
- **A prior source doc's chainId `50002` is stale/wrong for Atlantic Testnet; a tweet claiming `688688` was a prompt-injection result and is ignored.** Confirm the canonical chainId + RPC URL from `docs.pharos.xyz` and `testnet.pharosnetwork.xyz` → "Add Testnet Manually" the moment you start.
- **x402 reality:** x402 is built on **EIP-3009 (`transferWithAuthorization`)**. The hosted facilitators (Coinbase et al.) support Base/Polygon/Arbitrum/World/Solana — **Pharos is not on that list.** So native x402 on Pharos means **self-hosting a facilitator** against an EIP-3009-capable USDC on Pharos testnet. This is the single biggest "can it run today" risk; the plan treats x402 as an **optional, isolated module**, not a core dependency.
- **ERC-8004 / ERC-8126 could not be verified as finalized or live on Pharos.** COVENANT therefore ships its **own** identity registry and does **not** hard-depend on any unratified EIP.
</aside>

---

# SECTION 1 — Final project definition

## Final name

**COVENANT** *(positioning line: "the credible-commitment layer for autonomous agents").*

## Final positioning

**The trust rail that lets an AI agent make a binding, simulated-and-certified, on-chain-enforced promise — and turns each kept promise into slashable Trust Capital that re-prices what the agent is allowed to do next.**

## Final architecture (the merge, not a bundle)

The three systems collapse into **one closed loop** where each arc fixes the others' fatal flaw:

```
IDENTITY ─▶ COVENANT (EIP-712 signed policy + TC-tiered limit curve)
   ▲                      │
   │                      ▼
TRUST CAPITAL ◀─ CERTIFICATION  (AEGIS: simulate → rules → GoPlus →
  (NEXUM:               │         signed ALLOW/WARN/DENY attestation)
  accrue / slash)       ▼
   ▲           GUARDED EXECUTION (on-chain: revert unless a fresh
   │            matching ALLOW attestation exists)
   └────── PROOF (DecisionLog receipts: intent + verdict + outcome)
```

- **AEGIS becomes the enforcement+proof arc, made rigorous:** a transaction is *certified before it runs* (simulation + deterministic rules + GoPlus risk read) and the certificate is a signed attestation that an on-chain `GuardedExecutor` **requires** — so the promise is physically un-breakable, not advisory.
- **NEXUM Trust Capital becomes the reputation arc, made Sybil-resistant:** TC is derived **only** from attested, enforced outcomes (kept covenants, blocked attempts, settled vs. defaulted obligations) — never from gameable wallet stats — and is **slashable**. TC tier feeds the covenant's auto-scaling limit curve.
- **Covenant is the binding-policy spine** that ties identity → permission → enforcement → reputation into a flywheel.

## Final feature set (Phase-1 shippable)

1. On-chain **agent identity** (owner key ↔ agent key ↔ metadata).
2. **EIP-712 covenant** (caps, allow/deny lists, time windows, counterparty min-TC, required pre-checks) with a **TC-tiered limit curve**.
3. **Execution certification**: pre-flight simulation (`eth_call` + `eth_estimateGas`) + deterministic policy engine + GoPlus counterparty/contract risk → **signed ALLOW/WARN/DENY** attestation.
4. **GuardedExecutor**: reverts `CovenantBreach()` unless a fresh signed ALLOW attestation matches the intent hash.
5. **DecisionLog**: append-only on-chain receipts (intent, verdict, reason hash, outcome hash).
6. **Trust Capital**: accrual/slash oracle, tiers, provenance-cited score writes.
7. **MCP Skill** exposing the tool surface (Section 4).
8. **LLM explainer** (deterministic-first; LLM only explains/classifies, never authorizes funds).
9. **Indexer + dashboard**: covenant builder, live decision feed, reputation explorer.
10. **CertiK-scanner-clean** codebase with CI self-scan + verified contracts.

---

# SECTION 2 — Production Reality Audit

| Feature | Status | Reality / action |
| --- | --- | --- |
| Solidity contracts on Pharos testnet (Identity, Covenant, DecisionLog, Reputation, GuardedExecutor) | **Real** | Standard EVM; Pharos is EVM-equivalent. Deploy + verify on `atlantic.pharosscan.xyz`. |
| EIP-712 signed covenants + ALLOW attestations | **Real** | `viem`/`ethers` typed-data signing; verify on-chain with `ecrecover`/OZ `ECDSA`. |
| Pre-flight simulation via `eth_call`  • `eth_estimateGas` | **Real** | Standard JSON-RPC, confirmed supported (`docs.pharos.xyz` JSON-RPC methods). |
| Full state-fork tracing (`debug_traceCall` / archive fork) | **Partially real** | `debug_*` not guaranteed on public RPC. **Action:** detect at boot; if absent, fall back to `eth_call`+`estimateGas`+static decode. Do NOT promise full opcode tracing. |
| GoPlus counterparty/contract risk read | **Real** | `https://api.gopluslabs.io`, key from `console.gopluslabs.io`. Note: GoPlus chain coverage for Pharos may be partial — design as a *signal that can only lower* trust, with graceful "unknown" handling. |
| Deterministic rules engine (caps/lists/windows) | **Real** | Pure TS logic; the authoritative safety verdict. |
| DecisionLog on-chain receipts | **Real** | Event + storage writes; this is the demo centerpiece (visible testnet activity). |
| GuardedExecutor revert-on-breach | **Real** | Core enforcement; fully testable in Foundry. |
| Trust Capital accrual/slash + tiers | **Real** | Oracle-written, provenance-cited. Single authorized oracle in Phase 1. |
| LLM explainer (reason text / intent classification) | **Real** | Anthropic or ZAN MaaS or Pharos gateway; temp 0, JSON-schema-validated, rule-based fallback. |
| MCP server + tools | **Real** | `@modelcontextprotocol/sdk`; testable with an MCP client. |
| Indexer (events→Postgres) + Redis cache + Next.js dashboard | **Real** | Standard stack. |
| x402 payment guarding | **Partially real** | No Pharos hosted facilitator. **Action:** isolated module; self-host a minimal EIP-3009 facilitator against testnet USDC **only if** an EIP-3009 USDC exists on Pharos testnet. If not confirmable, ship the 402-challenge/receipt flow against a self-hosted verifier and label payments "experimental." Not on the Phase-1 critical path. |
| Staked/slashed **decentralized oracle network** | **Partially real** | Single authorized oracle is real now. Multi-oracle staking/slashing is **Phase 2** — do not claim it shipped. |
| ERC-8004 / ERC-8126 identity & verification | **Not real (as a dependency)** | Unverified/unratified. **Cut the hard dependency**; ship COVENANT's own identity registry; optionally expose an adapter interface for later. |
| "AEGIS risk model fine-tuned on 405 exploits / $4.6M simulated patterns" | **Not real** | Fantasy in this timeframe and a CertiK-scan liability. **Cut.** Replace with deterministic rules + GoPlus + LLM anomaly flag. |
| ZK-KYC native integration, credit-default swaps, agent bonds, cross-chain TC portability | **Not real** | **Cut from Phase 1.** Park in Phase 2/3 vision only. |
| Mainnet deployment | **Not real** | Testnet only; do not imply mainnet. |

**Rule applied:** every "Not real" item is removed from the build. Every "Partially real" item is isolated behind a capability check so the core ships even if it's unavailable.

---

# SECTION 3 — External Requirements (what *you* must obtain)

| Item | Where (exact URL) | Notes |
| --- | --- | --- |
| EVM wallet (deployer/oracle) | MetaMask `metamask.io` | Create a **fresh** key only for testnet. Never reuse a mainnet key. This key signs attestations + deploys. |
| Pharos testnet network config + RPC URL | `testnet.pharosnetwork.xyz` → "Add Testnet Manually"; alt RPC: `zan.top/faucet/pharos` | **Confirm chainId 688689 + exact RPC string live.** ZAN provides a stable HTTPS/WSS RPC after login. |
| PHRS gas tokens | `testnet.pharosnetwork.xyz` (0.01–0.2/day), `faucets.chain.link/pharos-atlantic-testnet`, `zan.top/faucet/pharos` | Need enough for deploy + dozens of demo txs. Use multiple faucets. |
| Testnet USDC (only if doing x402) | `faucet.circle.com` | Confirm it lists Pharos + that the token is EIP-3009. If not, skip x402 for Phase 1. |
| Block explorer access | `atlantic.pharosscan.xyz`, `pharos-testnet.socialscan.io` | For contract verification + demo proof links. |
| GoPlus API key | `console.gopluslabs.io` (docs: `docs.gopluslabs.io/reference/token-security-api`) | Free tier. Base URL `https://api.gopluslabs.io`. |
| LLM API key | `console.anthropic.com` (or ZAN MaaS `zan.top`, or the Pharos $PROS/USDC LLM gateway if available) | Pick ONE. Anthropic is most reliable; mention the Pharos gateway in docs for sponsor alignment. |
| CertiK Skill Scanner access | Provided via the hackathon (DoraHacks page) — confirm the exact scanner URL/CLI from the event | Run it in CI; capture the PASS/score artifact for the README. |
| Anvita Flow Skill Hub account | `flow.anvita.xyz` | Register the Skill for composability points; confirm submission format. |
| Hackathon submission | `dorahacks.io/hackathon/pharos-phase1/detail` | Public GitHub/GitLab/Bitbucket link required; tags incl. AgentSkill, MCP, Onchain. |
| GitHub repo (public) | `github.com` | Real commit history; Actions enabled for CI. |
| IPFS pinning (covenant terms) | `pinata.cloud` or `web3.storage` | Store full covenant JSON; only the hash goes on-chain. |
| Postgres + Redis | `supabase.com` (PG) + `upstash.com` (Redis), or local Docker | Free tiers suffice for the indexer. |
| Dashboard hosting | `vercel.com` | Free tier; deploy the Next.js app. |

---

# SECTION 4 — Technical Architecture

## Backend architecture

Node.js/TypeScript monorepo (pnpm workspaces). One **skill server** process exposes both an MCP transport and a thin REST surface (for the dashboard). Stateless request handlers; all durable state is on-chain or in the indexer DB. Layers: `tools` (MCP) → `engine` (rules, simulator, riskRead, explainer) → `chain` (contract clients, signer, EIP-712). Egress is an explicit allowlist (Pharos RPC, GoPlus, LLM, IPFS).

## Smart contracts (Solidity ≥0.8.20, OpenZeppelin, Foundry)

- **`IdentityRegistry.sol`** — `register(agent, metadataURI)`, `rotateKey`, `revoke`; maps owner↔agent.
- **`CovenantRegistry.sol`** — stores `keccak256(covenantJSON)` per (owner, agent) + a `tierCurveRef`. Only hashes on-chain; full terms on IPFS.
- **`DecisionLog.sol`** — `logDecision(agent, intentHash, verdict, reasonHash, outcomeHash)`; append-only; indexed events.
- **`ReputationRegistry.sol`** — `score`, `tier` per agent; writable only by authorized scoring oracle; **every write cites the DecisionLog ids it derives from** (verifiable provenance).
- **`GuardedExecutor.sol`** — `execute(intent, allowAttestationId)`: verifies a fresh signed ALLOW attestation whose `intentHash == keccak256(target,data,value,nonce,agent)`; reverts `CovenantBreach()` otherwise; checks-effects-interactions; no `delegatecall`, no `tx.origin`.
- **`interfaces/`** for all five (composability + Phase-2 oracle swap).

## Database schema (Postgres, indexer-owned — never source of truth)

- `agents(address PK, owner, metadata_uri, registered_at, last_active)`
- `covenants(id PK, agent, covenant_hash, ipfs_uri, tier_curve, created_at)`
- `decisions(id PK, agent, intent_hash, verdict, reason, outcome_hash, tx_hash, block, ts)`
- `reputation(agent PK, score, tier, updated_at)` + `reputation_sources(rep_write_id, decision_id)`
- `obligations(id PK, agent, counterparty, amount, status, settled_tx, ts)` (for settled/defaulted TC inputs)
- All tables are **projections of on-chain events**; rebuildable from scratch by replaying logs.

## Queue system

**BullMQ on Redis.** Queues: `ingest` (new block log batches), `score` (recompute TC after relevant events), `cache-warm` (reputation reads). Idempotent jobs keyed by `(tx_hash, log_index)` so replays are safe.

## Event system

Indexer subscribes via `eth_getLogs` polling (WSS if available) to `AgentRegistered`, `CovenantSet`, `DecisionLogged`, `ReputationUpdated`, `CovenantBreach`. Each event → enqueue → project to DB → invalidate Redis. Dashboard live feed reads from a server-sent-events endpoint backed by the same projections.

## AI architecture (deterministic-first — this is a CertiK-pass decision)

- The **safety verdict is 100% deterministic** (rules + simulation result + GoPlus). The LLM **cannot** produce an ALLOW.
- LLM (temp 0, JSON-schema-validated output, hard timeout, rule-based fallback) is used only for: (a) human-readable DENY/WARN reasons, (b) intent classification, (c) a soft anomaly flag that can **only lower** trust.
- No model training, no fine-tuning, no opaque scoring.

## Security architecture

Non-custodial (server never holds user keys; the relayer signer only signs attestations, not value transfers). Egress allowlist. Input validation (`zod`) on every tool arg and every contract input. Rate limiting + body-size caps. Secrets in env only. Pinned deps + lockfile + SBOM. Contract access control on every write; reentrancy-safe (no value transfers in registries); full Foundry coverage; explorer-verified.

## Testing architecture

- **Contracts:** Foundry unit + fuzz + invariant tests (e.g., "no execution without matching fresh ALLOW"); gas snapshots.
- **Engine:** Vitest unit tests for rules, scoring, schema validation, fallback paths.
- **Integration:** ephemeral local chain (Anvil) + mocked-but-real GoPlus contract test doubles **only at the network boundary** (no fake business logic); end-to-end "intent → certify → guarded execute → receipt → TC update".
- **CI:** GitHub Actions runs build, lint, typecheck, Foundry, Vitest, **CertiK scan**, and a deploy-dry-run.

## Monitoring architecture

Structured logs (`pino`) with request ids; `/health` (RPC reachable, signer funded, DB/Redis up, last-indexed block lag); Prometheus-style counters (decisions by verdict, attestations issued, breaches caught, TC writes); alert if indexer lag > N blocks or signer balance < threshold.

---

# SECTION 5 — Repository Design (monorepo)

```
covenant/
├─ pnpm-workspace.yaml
├─ package.json                      # workspace root, shared scripts
├─ .github/workflows/
│  └─ ci.yml                         # build · lint · foundry · vitest · certik-scan · deploy-dry-run
├─ packages/
│  ├─ contracts/                     # Foundry project
│  │  ├─ src/
│  │  │  ├─ IdentityRegistry.sol
│  │  │  ├─ CovenantRegistry.sol
│  │  │  ├─ DecisionLog.sol
│  │  │  ├─ ReputationRegistry.sol
│  │  │  ├─ GuardedExecutor.sol
│  │  │  └─ interfaces/ (I*.sol x5)
│  │  ├─ test/ (unit · fuzz · invariant per contract)
│  │  ├─ script/ Deploy.s.sol · Verify.s.sol
│  │  └─ foundry.toml
│  ├─ shared/                        # cross-package types + constants
│  │  └─ src/ types.ts · chains.ts (chainId 688689) · abis/ · eip712.ts
│  ├─ skill/                         # MCP + REST server
│  │  ├─ src/
│  │  │  ├─ index.ts                 # boot: capability checks (debug_trace?, gas, signer funded)
│  │  │  ├─ mcp.json
│  │  │  ├─ tools/ registerIdentity · setCovenant · preflight · simulate ·
│  │  │  │        verifyCounterparty · attestOutcome · getReceipt · reputation ·
│  │  │  │        guardX402 · rotateKey
│  │  │  ├─ engine/ rules.ts · simulator.ts · riskRead.goplus.ts · explainer.llm.ts · schema.ts
│  │  │  ├─ chain/ clients.ts · signer.ts · eip712.ts
│  │  │  └─ http/ rest.ts · sse.ts · health.ts
│  │  └─ test/ (vitest unit + integration)
│  ├─ indexer/
│  │  ├─ src/ watcher.ts · projectors/*.ts · queue.ts · db/ (prisma schema + client)
│  │  └─ test/
│  ├─ x402/                          # ISOLATED, optional
│  │  └─ src/ facilitator.ts (EIP-3009) · middleware.ts  (feature-flagged off by default)
│  └─ web/                           # Next.js dashboard
│     └─ src/ app/ · components/ CovenantBuilder · DecisionFeed · ReputationExplorer · ProofLink
├─ scripts/
│  ├─ deploy.sh · verify.sh · seed.sh · demo-breach.sh · scan.sh (CertiK) · capability-check.sh
├─ docs/
│  ├─ README.md · ARCHITECTURE.md · SECURITY.md · REPUTATION_SPEC.md ·
│  ├─ INTEGRATION.md · PHASE2.md · THREAT_MODEL.md
└─ .env.example
```

---

# SECTION 6 — Implementation Order (correct dependency sequence)

1. **Repo + workspace + CI skeleton** (pnpm, Foundry init, Actions running empty green).
2. **`shared`**: chain constants (688689), EIP-712 covenant + attestation typed-data, ABIs placeholder, shared types. *(Everything depends on this.)*
3. **Contracts**: write all five + interfaces; Foundry unit/fuzz/invariant tests to green. *(Depends on 2's typed-data shapes.)*
4. **Deploy + verify** to Pharos testnet; record addresses to `.env`/`shared/chains.ts`. *(Depends on 3.)*
5. **`chain` layer**: typed contract clients + signer + EIP-712 sign/verify wired to deployed addresses. *(Depends on 4.)*
6. **Engine — rules + simulator**: deterministic policy engine + `eth_call`/`estimateGas` pre-flight + boot capability check for `debug_trace`. → implement **`preflight`/`simulate`** tools. *(Depends on 5.)*
7. **GuardedExecutor end-to-end**: issue signed ALLOW → `execute` succeeds; tamper intent → reverts `CovenantBreach()`; write **DecisionLog** receipt. *(Depends on 5,6 — this is the demo core; do it before anything optional.)*
8. **GoPlus `verifyCounterparty`** + LLM explainer (temp 0, schema-validated, fallback). *(Depends on 6.)*
9. **Indexer + queues** projecting events → Postgres; then **ReputationRegistry scoring oracle** with provenance-cited writes (`attestOutcome` → TC accrue/slash). *(Depends on 7's events.)*
10. **MCP wiring complete** (`reputation`, `getReceipt`, `registerIdentity`, `setCovenant`, `rotateKey`); test with an MCP client. *(Depends on 5–9.)*
11. **Dashboard**: CovenantBuilder, DecisionFeed (SSE), ReputationExplorer, ProofLink to explorer. *(Depends on indexer + REST.)*
12. **CertiK scan in CI → fix to PASS**; security hardening; verify contracts on explorer. *(Depends on full code.)*
13. **Docs + REPUTATION_SPEC + threat model + 90-sec demo**; run 5–10 live testnet covenants incl. one real breach; capture tx hashes.
14. **(Optional) x402 module** behind a feature flag — only if EIP-3009 USDC on Pharos is confirmed.
15. **Register on Anvita Flow Skill Hub + submit on DoraHacks.**

---

# SECTION 7 — Cursor Super Prompt

<aside>
🤖

Paste this as the project's system/initial instruction in Cursor. It is written to make Cursor behave like a senior team and refuse shortcuts.

</aside>

```
You are the senior engineering team building COVENANT, a production Skill for the
Pharos Atlantic Testnet (EVM, chainId 688689, native gas token PHRS). You write
production-grade TypeScript and Solidity only. This is NOT a demo or a prototype.

NON-NEGOTIABLE RULES:
- NEVER use mock data, fake services, stubbed integrations, or hardcoded fake
  responses. If a real endpoint/credential is required, read it from env and FAIL
  LOUDLY with a clear message if missing. Do not invent values.
- NEVER leave TODOs, placeholders, `any`, empty catch blocks, or "implement later".
  If a feature cannot be completed correctly, STOP and report exactly what is
  blocking it. Do not paper over it.
- NEVER guess external API shapes. Before integrating GoPlus, the LLM provider, or
  Pharos RPC, fetch and follow their real docs and write a thin typed client with
  zod-validated responses. Treat all external data as untrusted.
- The SAFETY VERDICT must be 100% deterministic (rules + simulation + GoPlus).
  The LLM may ONLY produce explanation text, intent classification, and a soft
  anomaly flag that can lower (never raise) trust. The LLM must never authorize a
  fund movement. Enforce this in code and in tests.
- Every contract write needs access control. No delegatecall, no tx.origin, no
  reentrancy. Solidity >=0.8.20, OpenZeppelin, checks-effects-interactions.
- Every module ships with tests: Foundry (unit + fuzz + invariant) for contracts;
  Vitest (unit + integration) for the server/indexer. A feature is not "done"
  until its tests pass in CI. Refuse to mark anything complete without tests.
- Validate every MCP tool argument and every contract input with zod / Solidity
  require. Declare and enforce an outbound network allowlist (Pharos RPC, GoPlus,
  the LLM endpoint, IPFS). No shell exec. No filesystem writes except a temp cache.
- Pin dependencies, commit a lockfile, generate an SBOM. The repo must pass the
  CertiK Skill Scanner; wire the scan into GitHub Actions and treat a non-PASS as
  a build failure.

BUILD ORDER (do not skip ahead; each step depends on the previous):
1. pnpm monorepo + Foundry + GitHub Actions (green empty pipeline).
2. packages/shared: chainId 688689 constants, EIP-712 typed data for Covenant and
   ALLOW attestation, shared types, ABIs.
3. packages/contracts: IdentityRegistry, CovenantRegistry, DecisionLog,
   ReputationRegistry, GuardedExecutor (+ interfaces). GuardedExecutor.execute
   MUST revert CovenantBreach() unless a fresh signed ALLOW attestation matches
   keccak256(target,data,value,nonce,agent). Full Foundry tests incl. an invariant
   that no execution is possible without a matching fresh ALLOW.
4. Deploy + verify on Pharos testnet; write addresses to shared/chains.ts.
5. packages/skill/chain: typed clients, EIP-712 signer/verifier.
6. engine/rules + engine/simulator: deterministic policy engine + eth_call &
   eth_estimateGas pre-flight. At boot, probe whether debug_traceCall exists; if
   not, fall back to eth_call+estimateGas and record the capability. Implement the
   preflight and simulate MCP tools.
7. End-to-end: issue ALLOW -> GuardedExecutor.execute succeeds -> DecisionLog
   receipt; tamper the intent -> revert. Integration test on a local Anvil fork.
8. engine/riskRead (GoPlus, real API, typed+validated, "unknown" handling) +
   engine/explainer (LLM, temp 0, JSON-schema validated, hard timeout, rule-based
   fallback). GoPlus "malicious" => hard DENY.
9. indexer: eth_getLogs watcher + BullMQ queues + Prisma/Postgres projections +
   Redis cache. ReputationRegistry scoring oracle: attestOutcome accrues/slashes
   Trust Capital; every score write cites the DecisionLog ids it derives from.
10. Finish MCP tools: registerIdentity, setCovenant, verifyCounterparty,
    attestOutcome, getReceipt, reputation, rotateKey. Test with an MCP client.
11. Next.js dashboard: CovenantBuilder, DecisionFeed (SSE), ReputationExplorer,
    ProofLink to atlantic.pharosscan.xyz.
12. Harden to CertiK PASS; verify contracts; write README, SECURITY.md,
    REPUTATION_SPEC.md, THREAT_MODEL.md.
13. x402 module is OPTIONAL and feature-flagged OFF; only implement against a
    confirmed EIP-3009 USDC on Pharos. Never make the core depend on it.

When blocked by a missing credential, undocumented API, or an RPC method Pharos
does not expose, STOP and tell me precisely what to provide or confirm. Do not
fabricate a workaround that hides the gap.
```

---

# SECTION 8 — Verification Framework

## Build verification checklist

- [ ]  `pnpm install` clean; lockfile committed; SBOM generated.
- [ ]  Typecheck + lint pass with zero `any` in `src`.
- [ ]  CI green: build · foundry · vitest · certik-scan · deploy-dry-run.
- [ ]  Boot capability check logs RPC method support (debug_trace yes/no) and signer balance.

## Security checklist

- [ ]  No shell exec; no fs writes outside temp cache; egress allowlist enforced + tested.
- [ ]  Every tool arg + contract input validated; oversized/malformed inputs rejected.
- [ ]  Secrets only in env; none in code or logs; `.env.example` documents all.
- [ ]  LLM cannot emit ALLOW (covered by a test).
- [ ]  CertiK Skill Scanner = **PASS**; artifact saved + linked in README.

## Integration checklist

- [ ]  GoPlus client hits real API, validates schema, handles "unknown"/rate-limit/`malicious→DENY`.
- [ ]  LLM client: temp 0, schema-validated, timeout, fallback exercised by a test that disables the LLM.
- [ ]  RPC client retries + handles reorg/lag; indexer rebuild-from-genesis verified.

## Contract checklist

- [ ]  Foundry unit + fuzz + invariant green; gas snapshot committed.
- [ ]  Invariant: no `execute` without a fresh matching ALLOW.
- [ ]  Access control on every write; reentrancy + delegatecall + tx.origin checks (none present).
- [ ]  Deployed **and verified** on `atlantic.pharosscan.xyz`; addresses in `shared`.

## API checklist

- [ ]  All MCP tools listed in `mcp.json` with input schemas; each has a passing test.
- [ ]  REST + SSE endpoints documented in `INTEGRATION.md`; `/health` returns real status.

## Deployment checklist

- [ ]  Contracts deployed + verified; signer funded; env complete.
- [ ]  Indexer caught up (lag < N blocks); dashboard live on Vercel.
- [ ]  5–10 live testnet covenants incl. ≥1 real breach; tx hashes in README.
- [ ]  Registered on Anvita Flow Skill Hub; DoraHacks submission complete with repo + video + addresses.

---

# SECTION 9 — Judge Optimization

| Category | How to maximize it |
| --- | --- |
| **Pharos judges (vision/deployment)** | Show real testnet activity: live DecisionLog receipts + a clickable breach revert on `atlantic.pharosscan.xyz`. Frame COVENANT as the primitive that makes "agents as on-chain economic actors" *safe to operate* — directly on-thesis for an RWA/compliant-finance L1. |
| **CertiK evaluation** | Be the security tool that *passes the security tool*. Deterministic safety core (no LLM in the authorize path), declared egress, no shell/fs, pinned deps + SBOM, verified contracts, and a `SECURITY.md` threat model that mirrors the scanner's five risk classes. Put the **PASS badge** at the top of the README. |
| **Reusability / composability** | Every other agent is a customer: three calls (`preflight`, `attestOutcome`, `reputation`). Publish interfaces, register on Anvita Flow, and show a second toy agent calling COVENANT before it pays. |
| **Ecosystem alignment** | Native GoPlus risk reads (sponsor amplification), Pharos RPC simulation + on-chain attestations, optional Pharos LLM gateway, x402-ready interface. Cite each sponsor explicitly in the submission. |
| **Security score** | On-chain enforcement (GuardedExecutor revert) beats advisory checks; non-custodial; provenance-cited reputation (no magic numbers); slashable Trust Capital. |
| **Innovation score** | The closed loop is the novelty: certification produces the proof that produces the only Sybil-resistant reputation that re-parameterizes the next covenant. Lead with "trustworthiness is a credence good; COVENANT makes agent promises *binding*." |

**Single highest-leverage demo moment:** an agent's payment **reverts** against its covenant on-chain, then a compliant one **settles**, then its Trust Capital **ticks up** — one 90-second clickable arc. That out-scores any slide.

---

# SECTION 10 — Final Readiness Report (brutally honest)

## Weakest areas

- **x402 on Pharos** has no hosted facilitator; self-hosting an EIP-3009 facilitator is uncertain within the timeframe. Keep it optional and off the critical path. Do not let it block submission.
- **Full execution simulation** is shallow without `debug_traceCall`; `eth_call`+`estimateGas`+static decode catches reverts and obvious balance effects but **not** deep multi-hop exploit chains. Be honest about this in `SECURITY.md`; don't claim AEGIS-grade tracing you can't run on Pharos public RPC.
- **Reputation has nothing to rate yet** (cold start). TC is architecturally sound but starts empty.

## Biggest risks

1. **Deadline (≈June 17–18).** The full do-it-right build is ~5 days; the window is shorter. If forced, the Phase-1-critical path is steps 1–8 + 12–13 (contracts + preflight + GuardedExecutor + receipts + GoPlus + CertiK PASS + docs/video); indexer/dashboard/x402 are deferrable.
2. **CertiK false-positive on network/LLM egress.** Mitigated by deterministic core + declared allowlist, but budget time to iterate the scan.
3. **Pharos RPC instability / missing methods.** Capability-probe at boot and degrade gracefully.
4. **Identity-standard drift** (ERC-8004/8126). Mitigated by shipping our own registry behind an adapter.

## Missing dependencies (you must confirm before coding)

Exact Pharos RPC URL + final chainId; whether `debug_*` is exposed; GoPlus chain coverage for Pharos; existence of an EIP-3009 USDC on Pharos testnet; the canonical CertiK Skill Scanner URL/CLI; the Anvita Flow Skill submission format.

## Expected development time

- **Do-it-right (full feature set):** ~5 focused days for 1–2 strong engineers (+ Cursor).
- **Phase-1-critical path only:** ~2–2.5 days.

## Calibrated probabilities (no hype)

- **Completion of the Phase-1-critical path before deadline:** ~70–80% with focused execution; ~40% for the *full* feature set in time.
- **Winning Phase 1 (top-40 of ~340; 40 slots):** **~65–80%**, *conditional* on shipping the enforced GuardedExecutor + on-chain receipts **and** a visible CertiK PASS. Standout/top-5: ~25–35%. A slideware version with no working enforcement drops this below ~45%.
- **Winning Phase 2 (winners-only):** **~30–45% if you win Phase 1** — the Covenant Agent (autonomous guardian/credit-bureau) is among the strongest deployed-agent stories, but Phase 2 is judged on an operating agent, not a spec.
- **Real post-hackathon adoption:** **~10–20%.** The honest blocker is cold-start: there's little autonomous on-chain agent volume to govern today. If the agent economy materializes on Pharos, COVENANT is well-positioned; if it doesn't, this is excellent infrastructure ahead of its demand.

**One-sentence verdict:** COVENANT is the correct *primitive* and a strong Phase-1 contender **if and only if** you ship the enforced loop (not just a firewall) with a clickable on-chain breach and a CertiK PASS; everything else in this plan is secondary to those two artifacts.