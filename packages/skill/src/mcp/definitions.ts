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

export const MCP_SERVER_INSTRUCTIONS = `COVENANT is the trust rail for autonomous agents on Pharos Atlantic (chainId 688689).
Use BEFORE moving funds or calling contracts on behalf of an agent.

Standard payment flow:
1. covenant_reputation — check Trust Capital tier
2. covenant_preflight — deterministic rules + simulation + risk → ALLOW/WARN/DENY + signed attestation
3. (client submits GuardedExecutor.execute with attestation)
4. covenant_get_receipt — audit DecisionLog entry

Do NOT use LLM judgment to authorize transfers — only covenant_preflight verdict ALLOW permits execution.
Read-only tools work without private keys. Write tools require COVENANT_OWNER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY.`;

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
      "Run deterministic preflight (covenant rules + eth_call simulation + optional GoPlus) and sign ALLOW attestation if permitted. Use BEFORE any guarded execution or payment. Do NOT use after execution (use covenant_get_receipt) or for read-only chain queries (use covenant_simulate). Returns verdict ALLOW|WARN|DENY, violations, intentHash, and attestation when ALLOW.",
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
};

export type ToolName = (typeof toolDefinitions)[number]["name"];

export function resolveToolName(name: string): ToolName | undefined {
  if (toolDefinitions.some((t) => t.name === name)) {
    return name as ToolName;
  }
  const alias = toolAliases[name];
  return alias;
}
