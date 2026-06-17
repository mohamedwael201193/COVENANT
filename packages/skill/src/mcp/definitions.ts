/**
 * MCP tool catalog — descriptions written for LLM tool selection (not human docs).
 * Follows MCP best practices: purpose, when to use, when NOT to use, workflow hints.
 */

const ADDRESS = {
  type: "string" as const,
  pattern: "^0x[a-fA-F0-9]{40}$",
  description: "EVM address (0x + 40 hex chars)",
};

const PRIVATE_KEY = {
  type: "string" as const,
  pattern: "^0x[a-fA-F0-9]{64}$",
  description: "Owner/oracle private key. NEVER log or persist. Use env COVENANT_OWNER_PRIVATE_KEY when possible.",
};

const INTENT = {
  type: "object" as const,
  description: "On-chain intent to evaluate or execute",
  properties: {
    agent: ADDRESS,
    target: { ...ADDRESS, description: "Contract or EOA the agent will call" },
    data: { type: "string", description: "Calldata hex (0x prefixed)" },
    value: { type: "string", description: "Value in wei as decimal string" },
    nonce: { type: "string", description: "Unique intent nonce (use timestamp or incrementing id)" },
  },
  required: ["agent", "target", "data", "value", "nonce"],
};

export const MCP_SERVER_INSTRUCTIONS = `COVENANT — Stripe + OAuth for AI Agents on Pharos Atlantic (chainId 688689).

ZERO-SETUP tools (no private keys, no API secrets):
covenant_health, covenant_reputation, covenant_simulate, covenant_preflight

Wallet flow (no keys in agent):
1. covenant_connect_wallet → SIWE message + connectUrl
2. covenant_create_session → sessionId with permissions
3. covenant_preflight → ALLOW/WARN/DENY (evaluation only)
4. covenant_sign_attestation → signed ALLOW (hosted COVENANT_API_URL or local attester env)
5. covenant_request_approval → approvalUrl for user wallet signature
6. covenant_execute_authorized → after user approves in browser
7. covenant_get_receipt → on-chain audit

Optional env: COVENANT_API_URL=https://covenant-skill.onrender.com for hosted attestation.`;

export const toolDefinitions = [
  {
    name: "covenant_health",
    description:
      "Check COVENANT skill connectivity, RPC probes, and attester balance. Use FIRST when debugging MCP setup or before a demo. Do NOT use for policy decisions — use covenant_preflight instead.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "covenant_reputation",
    description:
      "Read Trust Capital score and tier for an agent on Pharos. Use BEFORE covenant_preflight to understand tier-based limits, or AFTER execution to verify reputation changed. Do NOT use as authorization — preflight decides ALLOW/DENY.",
    inputSchema: {
      type: "object",
      properties: {
        agent: { ...ADDRESS, description: "Registered agent address" },
      },
      required: ["agent"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "covenant_preflight",
    description:
      "Evaluate intent against covenant rules + simulation (+ optional GoPlus if configured). NO secrets required. Returns ALLOW|WARN|DENY without signing. Use BEFORE payment. After ALLOW, call covenant_sign_attestation then covenant_request_approval. Do NOT use for gas-only debug (covenant_simulate).",
    inputSchema: {
      type: "object",
      properties: {
        intent: INTENT,
        covenantHash: {
          type: "string",
          pattern: "^0x[a-fA-F0-9]{64}$",
          description: "On-chain covenant hash from covenant_set_covenant",
        },
        covenant: {
          type: "object",
          description: "Covenant terms matching on-chain hash",
          properties: {
            version: { type: "string", enum: ["1"] },
            agent: ADDRESS,
            owner: ADDRESS,
            allowlist: { type: "array", items: ADDRESS },
            denylist: { type: "array", items: ADDRESS },
            baseMaxValueWei: { type: "string" },
            tierLimits: { type: "array", items: { type: "object" } },
            minCounterpartyTier: { type: "integer", minimum: 0, maximum: 4 },
            timeWindows: { type: "array", items: { type: "object" } },
            requiredChecks: {
              type: "array",
              items: { type: "string", enum: ["simulation", "goplus"] },
            },
            createdAt: { type: "string", format: "date-time" },
          },
          required: ["version", "agent", "owner", "allowlist", "denylist", "baseMaxValueWei", "minCounterpartyTier", "requiredChecks", "createdAt"],
        },
        counterpartyTier: { type: "integer", description: "Optional override for counterparty Trust Capital tier" },
        deadlineSeconds: { type: "integer", default: 3600, description: "Attestation validity window" },
      },
      required: ["intent", "covenant", "covenantHash"],
    },
  },
  {
    name: "covenant_simulate",
    description:
      "Simulate an intent via eth_call + eth_estimateGas without signing. Use to debug calldata or estimate gas BEFORE covenant_preflight. Do NOT use as authorization — simulation success does not mean ALLOW.",
    inputSchema: {
      type: "object",
      properties: {
        intent: INTENT,
        from: { ...ADDRESS, description: "Optional msg.sender override for simulation" },
      },
      required: ["intent"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "covenant_verify_counterparty",
    description:
      "GoPlus security signal for a counterparty/contract address. Use during risk review or when covenant requires goplus check. Do NOT use alone to approve transfers — combine with covenant_preflight.",
    inputSchema: {
      type: "object",
      properties: {
        address: { ...ADDRESS, description: "Counterparty or contract to assess" },
      },
      required: ["address"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "covenant_get_receipt",
    description:
      "Read DecisionLog receipt by id after execution. Use AFTER GuardedExecutor.execute to audit verdict, intentHash, and outcome. Do NOT use before preflight.",
    inputSchema: {
      type: "object",
      properties: {
        decisionId: { type: "string", description: "DecisionLog id (decimal string, e.g. '0')" },
      },
      required: ["decisionId"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "covenant_sign_attestation",
    description:
      "Sign ALLOW attestation after covenant_preflight returns ALLOW/WARN. Uses COVENANT_API_URL (hosted, recommended) OR local DEPLOYER_PRIVATE_KEY. Agent never needs user private keys. Do NOT use before preflight evaluation.",
    inputSchema: {
      type: "object",
      properties: {
        intent: INTENT,
        covenantHash: { type: "string", pattern: "^0x[a-fA-F0-9]{64}$" },
        covenant: { type: "object" },
        deadlineSeconds: { type: "integer", default: 3600 },
      },
      required: ["intent", "covenant", "covenantHash"],
    },
  },
  {
    name: "covenant_connect_wallet",
    description:
      "Start wallet onboarding via Sign-In With Ethereum (SIWE). Returns message for user to sign and connectUrl. Use FIRST when agent needs user wallet authorization. No private keys.",
    inputSchema: {
      type: "object",
      properties: { walletAddress: ADDRESS },
      required: ["walletAddress"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "covenant_create_session",
    description:
      "Create authorized agent session after user signs SIWE message from covenant_connect_wallet. Grants permissions (reputation, simulate, preflight, execute) for 7-90 days. No private keys stored.",
    inputSchema: {
      type: "object",
      properties: {
        walletAddress: ADDRESS,
        agentAddress: ADDRESS,
        signature: { type: "string" },
        message: { type: "string" },
        nonce: { type: "string" },
        permissions: { type: "array", items: { type: "string" } },
        maxSpendWei: { type: "string" },
        durationDays: { type: "integer", default: 7 },
      },
      required: ["walletAddress", "signature", "message", "nonce"],
    },
  },
  {
    name: "covenant_request_approval",
    description:
      "After ALLOW preflight, create human-in-the-loop approval. Returns approvalUrl — user opens in browser and signs with their wallet. Required before moving funds. No agent private keys.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        intentHash: { type: "string", pattern: "^0x[a-fA-F0-9]{64}$" },
        verdict: { type: "string", enum: ["ALLOW", "WARN", "DENY"] },
        preflightSummary: { type: "object" },
        executionPayload: {
          type: "object",
          description: "Required for UI execution: intent, covenantHash, attestation from covenant_sign_attestation, optional preflightRequest",
          properties: {
            intent: INTENT,
            covenantHash: { type: "string", pattern: "^0x[a-fA-F0-9]{64}$" },
            attestation: {
              type: "object",
              properties: {
                deadline: { type: "string" },
                v: { type: "integer" },
                r: { type: "string" },
                s: { type: "string" },
              },
            },
            preflightRequest: { type: "object" },
          },
        },
      },
      required: ["sessionId", "intentHash", "verdict"],
    },
  },
  {
    name: "covenant_get_pending_approvals",
    description: "List pending approval requests for a session. Use to poll until user completes wallet signature.",
    inputSchema: {
      type: "object",
      properties: { sessionId: { type: "string" } },
      required: ["sessionId"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "covenant_execute_authorized",
    description:
      "Check approval status after user signed at approvalUrl. Returns ready-to-execute when approved. Agent still submits tx via user wallet — Covenant never custodies keys.",
    inputSchema: {
      type: "object",
      properties: { approvalId: { type: "string" } },
      required: ["approvalId"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "covenant_revoke_session",
    description: "Revoke an agent session immediately. Use when user disconnects wallet or security concern.",
    inputSchema: {
      type: "object",
      properties: { sessionId: { type: "string" } },
      required: ["sessionId"],
    },
  },
  {
    name: "covenant_register_identity",
    description:
      "Register a new agent key on IdentityRegistry (on-chain). Use ONCE when onboarding a new agent. Do NOT use for covenant updates (covenant_set_covenant) or key rotation (covenant_rotate_key). Requires owner private key.",
    inputSchema: {
      type: "object",
      properties: {
        agent: ADDRESS,
        metadataURI: { type: "string", description: "ipfs:// or https:// metadata URI" },
        ownerPrivateKey: PRIVATE_KEY,
      },
      required: ["agent", "metadataURI", "ownerPrivateKey"],
    },
    annotations: { destructiveHint: true },
  },
  {
    name: "covenant_set_covenant",
    description:
      "Publish covenant policy hash + IPFS URI for an agent. Use AFTER covenant_register_identity and BEFORE first covenant_preflight. Do NOT use for execution or attestation. Requires owner private key.",
    inputSchema: {
      type: "object",
      properties: {
        agent: ADDRESS,
        covenant: { type: "object", description: "Full covenant terms object (version 1)" },
        ipfsURI: { type: "string" },
        ownerPrivateKey: PRIVATE_KEY,
      },
      required: ["agent", "covenant", "ipfsURI", "ownerPrivateKey"],
    },
    annotations: { destructiveHint: true },
  },
  {
    name: "covenant_rotate_key",
    description:
      "Rotate agent signing key for an owner. Use when agent key is compromised. Do NOT use for new agents (covenant_register_identity). Requires owner private key.",
    inputSchema: {
      type: "object",
      properties: {
        newAgent: ADDRESS,
        ownerPrivateKey: PRIVATE_KEY,
      },
      required: ["newAgent", "ownerPrivateKey"],
    },
    annotations: { destructiveHint: true },
  },
  {
    name: "covenant_attest_outcome",
    description:
      "Oracle write to ReputationRegistry with DecisionLog provenance. Use ONLY by authorized oracle after verified outcomes. Do NOT use for preflight or execution. Requires oracle signer (DEPLOYER_PRIVATE_KEY).",
    inputSchema: {
      type: "object",
      properties: {
        agent: ADDRESS,
        score: { type: "string", description: "Trust Capital score as decimal string" },
        tier: { type: "integer", minimum: 0, maximum: 4 },
        decisionIds: { type: "array", items: { type: "string" }, description: "DecisionLog ids cited" },
      },
      required: ["agent", "score", "tier", "decisionIds"],
    },
    annotations: { destructiveHint: true },
  },
] as const;

/** Legacy names from early docs — mapped to covenant_* handlers */
export const toolAliases: Record<string, (typeof toolDefinitions)[number]["name"]> = {
  registerIdentity: "covenant_register_identity",
  setCovenant: "covenant_set_covenant",
  preflight: "covenant_preflight",
  simulate: "covenant_simulate",
  verifyCounterparty: "covenant_verify_counterparty",
  attestOutcome: "covenant_attest_outcome",
  getReceipt: "covenant_get_receipt",
  reputation: "covenant_reputation",
  rotateKey: "covenant_rotate_key",
  signAttestation: "covenant_sign_attestation",
  oracleAttest: "covenant_attest_outcome",
};

export type ToolName = (typeof toolDefinitions)[number]["name"];

export function resolveToolName(name: string): ToolName | undefined {
  if (toolDefinitions.some((t) => t.name === name)) {
    return name as ToolName;
  }
  const alias = toolAliases[name];
  return alias;
}
