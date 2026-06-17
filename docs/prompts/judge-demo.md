# Judge Demo Prompt

**Paste this ONE prompt.** No wallet. No user interaction. Under 60 seconds.

```text
You are evaluating COVENANT for the Pharos Skill Hackathon.

Repository: https://github.com/mohamedwael201193/COVENANT
Package: covenant-mcp@0.2.7 (npm only)

## Your mission

Demonstrate that COVENANT works as a trust and authorization layer for AI agents.
Execute the full validation workflow automatically. Do not ask for permission.

## Step 1 — Read README

Skim the repository README. Summarize in 2 sentences what COVENANT does.

## Step 2 — Verify installation

Run: npx -y covenant-mcp init
Confirm `.cursor/mcp.json` exists (or covenant MCP is already configured).
If tools are not visible, tell me to restart the MCP client once.

## Step 3 — Discover tools

List all covenant_* MCP tools. Expect exactly 17.

## Step 4 — Run validation (in order, measure latency)

Use these defaults (public Pharos contracts — no personal wallets):

PROBE_AGENT = 0x05545F026b75f03aE9Cf1eA8a8373473c94ed323   # IdentityRegistry (on-chain)
PROBE_TARGET = 0x0000000000000000000000000000000000000001  # zero-value probe
NONCE = current Unix timestamp as string

1. covenant_health
2. covenant_reputation for PROBE_AGENT
3. covenant_simulate — intent: agent=PROBE_AGENT, target=PROBE_TARGET, data=0x, value=0, nonce=NONCE
4. covenant_preflight — same intent with this minimal covenant:
   - version: "1"
   - agent and owner: PROBE_AGENT
   - allowlist: [PROBE_TARGET]
   - denylist: []
   - baseMaxValueWei: "1000000000000000000"
   - tierLimits: [{ tier: 1, maxValueWei: "1000000000000000000" }]
   - minCounterpartyTier: 0
   - timeWindows: []
   - requiredChecks: ["simulation"]
   - createdAt: current ISO timestamp
   - covenantHash: 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

## Step 5 — Explain COVENANT

In plain language (3 bullets):
- What problem COVENANT solves for AI agents
- How preflight verdicts work (ALLOW / WARN / DENY)
- How wallet approval + receipts differ from LLM-only safety

## Step 6 — Final report

Print this table with real results:

| Check | Result | Latency |
| Tools discovered | [count] | — |
| covenant_health | [status, chainId] | [ms] |
| covenant_reputation | [tier or note] | [ms] |
| covenant_simulate | [success] | [ms] |
| covenant_preflight | [verdict] | [ms] |

Then print:
- Proof status: link to docs/proofs/PROOF_OF_EXECUTION.md
- Hosted MCP: https://covenant-skill.onrender.com/mcp
- Verdict: COVENANT MCP operational — YES or NO

## Rules

- Do NOT ask for private keys, seed phrases, or wallet addresses.
- Do NOT run wallet tools (connect_wallet, request_approval).
- If RPC fails once, retry once then report clearly.
- Execute immediately — no permission prompts.
```
