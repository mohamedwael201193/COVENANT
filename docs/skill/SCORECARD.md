# COVENANT Skill Scorecard

Post-productization self-assessment (v0.1.0).

## Scores (1–10)

| Dimension | Score | Notes |
|---|---|---|
| **Skill Quality** | 8/10 | Rich tool descriptions, workflow instructions, 10 discoverable tools. Missing MCP resources/prompts. |
| **Agent Usability** | 8/10 | `npx covenant-mcp init`, client configs, AGENTS.md, payment flow docs. Hosted MCP would reach 9+. |
| **MCP Compliance** | 9/10 | stdio transport, JSON Schema inputs, readOnly/destructive hints, aliases, ListTools complete. |
| **Reusability** | 8/10 | Published package shape, Pharos-agnostic patterns, REST fallback. Tied to Pharos contracts today. |
| **Composability** | 9/10 | Clear pipeline: reputation → preflight → execute → receipt. Works with Claude, Cursor, OpenAI Agents. |
| **Pharos Alignment** | 10/10 | Atlantic testnet, GuardedExecutor, Trust Capital, GoPlus, deployed contracts. |

**Overall: 8.7 / 10** — "Stripe for Agent Trust" positioning achieved for MCP; dashboard demoted to demo.

## Checklist (requirements)

| # | Requirement | Status |
|---|---|---|
| 1 | Official MCP server package | ✅ `covenant-mcp` |
| 2 | NPM package | ✅ publish-ready |
| 3 | One-command install | ✅ `npx covenant-mcp init` |
| 4 | MCP config examples | ✅ 5 clients in `packages/mcp/config/` |
| 5 | Improved tool descriptions | ✅ purpose / when / when-not in schemas |
| 6 | Agent-ready examples | ✅ `docs/skill/EXAMPLES.md` |
| 7 | Integration examples | ✅ `docs/skill/INTEGRATIONS.md` |
| 8 | Remove dashboard-centric framing | ✅ README + AGENTS.md skill-first |
| 9 | Tools discoverable | ✅ `covenant_*` + tests |
| 10 | 5-minute install guide | ✅ `docs/skill/INSTALL.md` |
| 11 | Comparison vs top MCP | ✅ `docs/skill/COMPARISON.md` |
| 12 | Final score | ✅ this document |

## Next releases (v0.2)

- MCP SSE on Render
- MCP resources for receipts and covenants
- Smithery listing
- Env-only signing (no `ownerPrivateKey` in tool args)
