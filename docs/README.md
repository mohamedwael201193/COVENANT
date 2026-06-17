# COVENANT Documentation

**Developers:** start with the [README](../README.md).

## I want to…

| Goal | Document |
|---|---|
| Install COVENANT | [README § Installation](../README.md#installation) |
| Configure MCP client | [README § MCP Configuration](../README.md#mcp-configuration) |
| Understand wallet flow | [README § Wallet Authorization](../README.md#wallet-authorization-flow) |
| See all 17 tools | [MCP_REFERENCE.md](./MCP_REFERENCE.md) |
| Copy-paste agent prompts | [prompts/](./prompts/) |
| Run workflow examples | [skill/EXAMPLES.md](./skill/EXAMPLES.md) |
| Fix an error | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |
| Deploy / operate | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Verify hackathon proof | [JUDGE_QUICK_START.md](./JUDGE_QUICK_START.md) |

## Agent prompts (production)

| Prompt | Purpose |
|---|---|
| [agent-install.md](./prompts/agent-install.md) | Install MCP |
| [agent-bootstrap.md](./prompts/agent-bootstrap.md) | Validate installation |
| [agent-health-check.md](./prompts/agent-health-check.md) | Smoke test |
| [agent-reputation-review.md](./prompts/agent-reputation-review.md) | Trust Capital |
| [agent-risk-review.md](./prompts/agent-risk-review.md) | Preflight workflow |
| [agent-wallet-authorization.md](./prompts/agent-wallet-authorization.md) | SIWE session |
| [agent-request-approval.md](./prompts/agent-request-approval.md) | Approval URL |
| [agent-end-to-end.md](./prompts/agent-end-to-end.md) | Full workflow |
| [agent-send-money.md](./prompts/agent-send-money.md) | Send PHRS |
| [agent-counterparty-check.md](./prompts/agent-counterparty-check.md) | Recipient risk |

## Reference

| Doc | Description |
|---|---|
| [DOCUMENTATION_MAP.md](./DOCUMENTATION_MAP.md) | Full hierarchy |
| [MCP_REFERENCE.md](./MCP_REFERENCE.md) | Tool schemas |
| [API_REFERENCE.md](./API_REFERENCE.md) | REST endpoints |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design |
| [SECURITY.md](./SECURITY.md) | Threat model |
| [skill/INTEGRATIONS.md](./skill/INTEGRATIONS.md) | Client integrations |

## Judges & submission

| Doc | Description |
|---|---|
| [JUDGE_QUICK_START.md](./JUDGE_QUICK_START.md) | Proof verification |
| [proofs/PROOF_OF_EXECUTION.md](./proofs/PROOF_OF_EXECUTION.md) | On-chain evidence |
| [submission/](./submission/) | Hackathon submission docs |

## Internal

| Doc | Description |
|---|---|
| [../AGENTS.md](../AGENTS.md) | Agent skill manifest |
| [../AGENT_EXPERIENCE_AUDIT.md](../AGENT_EXPERIENCE_AUDIT.md) | DX scorecard |
