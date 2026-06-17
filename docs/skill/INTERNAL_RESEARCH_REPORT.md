# COVENANT Phase 1 Research Report

This report is for internal judging preparation. It intentionally describes hackathon competitors by category rather than by name.

## Executive Finding

The strongest public MCP and wallet products all optimize for the same promise: install fast, authenticate in a browser, expose a compact tool surface, and make the agent path obvious without reading docs. Covenant already has the rare technical core competitors do not: deterministic preflight, on-chain DecisionLog receipts, Pharos-native Trust Capital, and wallet approval URLs. The remaining gap is productization: hosted MCP, persistent approvals, skill-first docs, and end-to-end wallet proof.

## External MCP Patterns

### Anthropic MCP / Claude Code / Cursor

- Stdio remains the fastest local install path: `npx -y <server>`.
- Remote MCP is the production path for SaaS-like integrations.
- Claude Code and Cursor support HTTP/Streamable HTTP servers through a `url` config.
- Hosted servers should avoid secrets in project configs and use OAuth-style browser flows.
- Tool count matters. Compact, workflow-oriented tool surfaces are easier for agents to use than broad API mirrors.

Implication for Covenant:

- Keep `covenant-mcp` as the 2-minute stdio fallback.
- Expose `https://api.covenant.xyz/mcp` or current Render `/mcp` as the hosted path.
- Preserve zero-secret tools for first call success.
- Group docs around skills and workflows, not raw endpoints.

### OpenAI Agents SDK

- OpenAI supports hosted MCP tools by `serverLabel` + `serverUrl`.
- Hosted MCP is preferred for public trusted services.
- Local/private transports are still useful when the application owns filtering, approval, or network boundaries.

Implication for Covenant:

- A public hosted MCP endpoint is necessary for OpenAI compatibility.
- Approval policy should remain outside the LLM: Covenant evaluates and the wallet signs.

### Smithery / Marketplace Pattern

- Discoverability is a product feature.
- Strong marketplace entries provide a hosted URL, a local fallback, configuration schema, and a one-command install.
- OAuth/setup URLs are normal for user-owned permissions.

Implication for Covenant:

- Prepare a Smithery listing once hosted MCP is stable.
- Expose config-free discovery for public tools and browser-based setup for wallet authorization.

### GitHub / Stripe / Supabase / Zapier MCP Patterns

- Mature MCP servers prefer hosted endpoints.
- OAuth or browser authorization is preferred to long-lived secrets.
- When API keys are needed, they are scoped, restricted, and explicitly optional.
- Docs include copy-paste config for Cursor, Claude, OpenAI, and generic clients.
- Zapier’s strongest pattern is action enablement + approval/config URLs, not raw API exposure.

Implication for Covenant:

- Covenant should present wallet approvals as "Stripe Checkout for agent transactions".
- Agents should receive URLs and IDs, not hidden setup steps.
- Public tools must never require GoPlus, private keys, or RPC secrets.

## Wallet Authorization Research

### SIWE + Approval URL

Best near-term fit. A user proves wallet ownership by signing a SIWE message, Covenant stores a persisted session, and money movement creates an approval URL. This matches OAuth device/browser patterns and works in Cursor, Claude, Antigravity, and OpenAI because the wallet interaction happens outside the agent.

### WalletConnect / Reown

Best production wallet UX. One-click auth combines wallet connect and SIWE where wallets support it. ReCaps/permission strings map well to Covenant sessions: permissions, expiry, spend limits, and targets.

### Privy / Dynamic

Best consumer onboarding, especially for embedded wallets and social login. Not ideal as the core Covenant security primitive because policy enforcement can become vendor/off-chain unless paired with smart accounts or GuardedExecutor.

### Safe / ERC-4337 / Session Keys

Best long-term agent autonomy. Session keys on modular smart accounts give bounded permissions without per-transaction wallet prompts. This is stronger UX than signing every transaction, but it needs account abstraction infrastructure and Pharos compatibility validation.

### Chosen Architecture

Hybrid now, account abstraction later:

1. v0.2/v0.3: SIWE session + persisted approval URL + user wallet execution.
2. v0.4: Reown AppKit for better wallet coverage and one-click auth.
3. v0.5: Safe/ERC-4337 session keys where Pharos support is proven.

This preserves the key invariant: user never shares keys, agent never stores secrets, Covenant never becomes custodian.

## Hackathon Landscape From `projects.md`

Most submissions fall into these categories:

- Read-only wallet analytics.
- NFT ownership, minting, and metadata tooling.
- Portfolio and ecosystem intelligence.
- Transaction debugging and contract inspection.
- RWA/yield recommendation or council-style analysis.
- Token/symbol safety checks.
- Revenue splitting or routing scripts.

Common strengths:

- Clear single-purpose skill names.
- Many are safe by default and read-only.
- Some have good one-command skill install flows.
- Several include live RPC tests, examples, and screenshots.

Common weaknesses:

- Few provide a reusable trust layer for other skills.
- Write flows often require private keys in env.
- Most do not solve user approval UX.
- Few create on-chain audit receipts.
- Many are CLI/demo-first rather than MCP-first.
- Most are standalone tools, not composable infrastructure.

## Why Judges Choose Covenant

Covenant can win if it is positioned as the missing safety and authorization layer for every other Pharos agent skill:

- It is reusable across payments, NFT mints, RWA actions, revenue routing, and arbitrary contract calls.
- It composes with other skills before execution.
- It gives agents deterministic ALLOW/WARN/DENY instead of LLM-only judgment.
- It creates DecisionLog receipts and Trust Capital updates on Pharos.
- It solves the hardest UX problem: "How can an AI agent request money movement without holding a key?"

## Current Covenant Advantages

- Real Antigravity validation of MCP install, discovery, health, reputation, simulate, and preflight.
- Published npm package: `covenant-mcp`.
- 17 `covenant_*` tools.
- Secret-free read/evaluate tools.
- Pharos Atlantic deployed contracts.
- GuardedExecutor + DecisionLog + ReputationRegistry.
- Persisted session and approval schema now exists.
- Approval UI can execute GuardedExecutor transactions.

## Remaining Product Gaps

- Hosted MCP endpoint must be documented and tested.
- Approval URLs must never be created in local-only memory.
- README must lead with skills and workflows.
- Prompt library needs complete wallet/preflight/send flows.
- Benchmarks need stricter targets and current logs.
- Clean-machine proof must include wallet/session/approval IDs and real tx hash after deployment.

## Recommended Production Architecture

```text
Agent
  -> Hosted MCP / stdio MCP
  -> covenant_preflight
  -> covenant_sign_attestation
  -> covenant_request_approval
  -> approvalUrl

User
  -> wallet browser flow
  -> SIWE session
  -> GuardedExecutor.execute

Pharos
  -> DecisionLog receipt
  -> Trust Capital update
```

## Sources Consulted

- Anthropic / Claude Code MCP docs: remote HTTP and stdio transport.
- Cursor MCP docs: project/global `mcp.json`, remote `url`, OAuth/static auth.
- OpenAI Agents SDK MCP docs: hosted MCP and streamable HTTP servers.
- Smithery docs: hosted setup URLs, OAuth, marketplace discoverability.
- Stripe MCP docs: hosted OAuth-first, local npx fallback.
- Supabase MCP docs: hosted OAuth and Dynamic Client Registration.
- Zapier MCP docs: setup URLs, tool enablement, OAuth connection flow.
- Reown / WalletConnect SIWE docs: one-click auth and permission recaps.
- AgentKit / agent wallet research: secure wallet providers and policy enforcement.
- Safe/ERC-4337/session key research: scoped delegated execution.
