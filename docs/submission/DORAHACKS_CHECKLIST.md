# DoraHacks Submission Checklist

Checklist aligned with COVENANT's actual implementation for Pharos / Agent Hackathon submission.

## Repository

- [ ] Public GitHub repo linked in submission form
- [ ] Root [README.md](../README.md) with status table and doc links
- [ ] [docs/README.md](./README.md) with contract addresses and live demo txs
- [ ] `pnpm-lock.yaml` committed
- [ ] No secrets in git (`.env` gitignored)

## Smart Contracts

- [ ] Deployed on Pharos Atlantic (chainId `688689`)
- [ ] Addresses documented:
  - IdentityRegistry: `0x05545F026b75f03aE9Cf1eA8a8373473c94ed323`
  - CovenantRegistry: `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770`
  - DecisionLog: `0x8A80D270dd7028536ecB6f92b04eec11F929d603`
  - ReputationRegistry: `0x92b8815A17D85E45DB5Da9952764Ee2ce072A973`
  - GuardedExecutor: `0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F`
- [ ] Foundry tests pass (`pnpm test:contracts` — 32 tests)
- [ ] Live demo transactions linked (see [README.md](./README.md#live-demo-transactions))
- [ ] Breach revert demonstrated (`CovenantBreach()`)

## Skill Server (MCP + REST)

- [ ] MCP server with 9 tools (see [MCP_REFERENCE.md](./MCP_REFERENCE.md))
- [ ] REST API on `:8787` documented ([API_REFERENCE.md](./API_REFERENCE.md))
- [ ] `/health` returns real attester + RPC status
- [ ] Deterministic preflight — LLM cannot ALLOW ([SECURITY.md](./SECURITY.md))
- [ ] GoPlus integration with graceful `unknown` on Pharos
- [ ] Egress allowlist enforced + tested

## Indexer + Dashboard

- [ ] Indexer REST on `:8788` with Postgres projections
- [ ] React + Vite dashboard (not Next.js)
- [ ] Dashboard deployed: https://web-eight-eta-26.vercel.app
- [ ] `VITE_API_URL` points to public skill server

## Security & CertiK

- [ ] [SECURITY.md](./SECURITY.md) threat model published
- [ ] Non-custodial architecture documented
- [ ] CertiK adapter at `packages/security/certik/`
- [ ] CertiK status: `WAITING_FOR_OFFICIAL_ACCESS` (honest disclosure)
- [ ] Update README when PASS badge available

## Deployment

- [ ] [render.yaml](../render.yaml) blueprint committed
- [ ] [DEPLOYMENT.md](./DEPLOYMENT.md) step-by-step guide
- [ ] [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) completed

## Demo & Video

- [ ] [DEMO_GUIDE.md](./DEMO_GUIDE.md) script prepared
- [ ] [JUDGE_TESTING_GUIDE.md](./JUDGE_TESTING_GUIDE.md) for evaluators
- [ ] 90-second arc: breach revert → compliant execute → Trust Capital tick
- [ ] Video shows clickable PharosScan tx links

## Sponsor Alignment

- [ ] **Pharos** — on-chain enforcement, Atlantic testnet deployment, RPC simulation
- [ ] **GoPlus** — counterparty risk reads in preflight
- [ ] **CertiK** — security adapter + SECURITY.md (pending scanner access)
- [ ] **Anvita Flow** — MCP skill registration (if applicable)

## Tests

- [ ] `pnpm test` — Vitest across TS packages
- [ ] `pnpm test:contracts` — Foundry
- [ ] `pnpm build` — clean build

## Submission Form Fields

- [ ] Project name: COVENANT
- [ ] One-liner: credible-commitment layer for autonomous agents
- [ ] Repo URL
- [ ] Demo URL (Vercel dashboard)
- [ ] Skill server URL (Render)
- [ ] Contract addresses (all five)
- [ ] Video URL
- [ ] Team contact

## Related Docs

- [SUBMISSION_CHECKLIST.md](./SUBMISSION_CHECKLIST.md)
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- [JUDGE_TESTING_GUIDE.md](./JUDGE_TESTING_GUIDE.md)
- [DEMO_GUIDE.md](./DEMO_GUIDE.md)
