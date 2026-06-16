# Submission Checklist

General submission readiness for COVENANT hackathon deliverables.

## Code Quality

- [ ] `pnpm install` succeeds on clean clone
- [ ] `pnpm generate:abis` produces ABIs in `packages/shared`
- [ ] `pnpm typecheck` passes (zero `any` in src per project standard)
- [ ] `pnpm lint` passes
- [ ] CI green on main branch

## Documentation

- [ ] [ARCHITECTURE.md](../ARCHITECTURE.md)
- [ ] [DEPLOYMENT.md](../DEPLOYMENT.md)
- [ ] [SECURITY.md](../SECURITY.md)
- [ ] [API_REFERENCE.md](../API_REFERENCE.md)
- [ ] [MCP_REFERENCE.md](../MCP_REFERENCE.md)
- [ ] [OPERATIONS.md](../OPERATIONS.md)
- [ ] [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
- [ ] [docs/README.md](../README.md) — addresses, demo txs, quick start

## Functional Requirements

- [ ] Agent identity registration works on testnet
- [ ] Covenant set + hash verification works
- [ ] Preflight returns ALLOW / WARN / DENY correctly
- [ ] ALLOW attestation signs EIP-712 typed data
- [ ] GuardedExecutor.execute succeeds with valid attestation
- [ ] GuardedExecutor reverts `CovenantBreach()` on invalid attestation
- [ ] DecisionLog records receipt after execution
- [ ] Reputation readable on-chain and via API

## Integration Points

- [ ] GoPlus API returns risk signal (may be `unknown` on Pharos)
- [ ] LLM explainer returns summary (optional if no key)
- [ ] MCP tools callable from Cursor with `MCP_STDIO_ENABLED=true`
- [ ] Dashboard loads agents, covenants, decisions from skill REST

## Live Evidence

- [ ] ≥1 ALLOW execution tx on PharosScan
- [ ] ≥1 breach revert documented
- [ ] Contract addresses match `packages/shared/src/chains.ts`
- [ ] Attester funded and `/health` ok

## Security Evidence

- [ ] `packages/skill/test/explainer.test.ts` — LLM cannot ALLOW
- [ ] `packages/skill/test/egress.test.ts` — egress allowlist
- [ ] `packages/skill/test/rules.test.ts` — deterministic rules
- [ ] Foundry invariant: no execute without ALLOW

## Deployment Evidence

- [ ] Render blueprint deploys skill + indexer + web
- [ ] Indexer migrations applied
- [ ] Vercel dashboard with correct `VITE_API_URL`

## Optional / Deferred

- [ ] CertiK PASS badge (blocked: `WAITING_FOR_OFFICIAL_ACCESS`)
- [ ] Contract explorer verification (needs `PHAROS_EXPLORER_API_KEY`)
- [ ] x402 module (`X402_ENABLED=false` — not on critical path)

## Artifacts to Attach

- [ ] GitHub repository link
- [ ] Demo video (≤ 5 min recommended)
- [ ] Architecture diagram (in ARCHITECTURE.md)
- [ ] Live dashboard URL
- [ ] Skill server health URL

## Related Docs

- [DORAHACKS_CHECKLIST.md](./DORAHACKS_CHECKLIST.md)
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- [JUDGE_TESTING_GUIDE.md](./JUDGE_TESTING_GUIDE.md)
