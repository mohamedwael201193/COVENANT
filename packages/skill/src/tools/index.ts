import {
  createWalletClient,
  http,
  keccak256,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hashCovenantTerms } from "covenant-shared";
import type { ChainClients } from "../chain/clients.js";
import {
  getCovenantRegistryRead,
  getIdentityRegistryRead,
  getReputationRegistryRead,
  readDecision,
  readReputation,
} from "../chain/clients.js";
import type { PreflightServices } from "../engine/preflightEvaluate.js";
import { runPreflightEvaluate } from "../engine/preflightEvaluate.js";
import { runPreflight } from "../engine/preflight.js";
import { hostedSignAttestation } from "../hosted/client.js";
import { simulateIntent } from "../engine/simulator.js";
import {
  attestOutcomeSchema,
  getReceiptSchema,
  preflightRequestSchema,
  registerIdentitySchema,
  reputationSchema,
  rotateKeySchema,
  setCovenantSchema,
  simulateRequestSchema,
  verifyCounterpartySchema,
  verdictLabel,
} from "../engine/schema.js";
import {
  handleConnectWallet,
  handleCreateSession,
  handleExecuteAuthorized,
  handleGetPendingApprovals,
  handleRequestApproval,
  handleRevokeSession,
} from "../session/handlers.js";
import { Verdict } from "covenant-shared";

function ownerWallet(clients: ChainClients, privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    chain: clients.chain,
    transport: http(clients.chain.rpcUrls.default.http[0]),
    account,
  });
}

export async function handleRegisterIdentity(clients: ChainClients, args: unknown) {
  const input = registerIdentitySchema.parse(args);
  const wallet = ownerWallet(clients, input.ownerPrivateKey as `0x${string}`);
  const { client: _c, ...contract } = getIdentityRegistryRead(
    clients.publicClient,
    clients.contracts.identityRegistry,
  );
  const hash = await wallet.writeContract({
    ...contract,
    chain: clients.chain,
    functionName: "register",
    args: [input.agent as `0x${string}`, input.metadataURI],
  });
  return { txHash: hash, agent: input.agent, metadataURI: input.metadataURI };
}

export async function handleSetCovenant(clients: ChainClients, args: unknown) {
  const input = setCovenantSchema.parse(args);
  const covenantJson = JSON.stringify(input.covenant);
  const covenantHash = hashCovenantTerms(covenantJson);
  const tierCurveRef = keccak256(new TextEncoder().encode(JSON.stringify(input.covenant.tierLimits)));
  const wallet = ownerWallet(clients, input.ownerPrivateKey as `0x${string}`);
  const { client: _c, ...contract } = getCovenantRegistryRead(
    clients.publicClient,
    clients.contracts.covenantRegistry,
  );
  const hash = await wallet.writeContract({
    ...contract,
    chain: clients.chain,
    functionName: "setCovenant",
    args: [input.agent as `0x${string}`, covenantHash, tierCurveRef, input.ipfsURI],
  });
  return { txHash: hash, covenantHash, tierCurveRef, ipfsURI: input.ipfsURI };
}

export async function handlePreflight(services: PreflightServices, args: unknown) {
  const input = preflightRequestSchema.parse(args);
  const result = await runPreflightEvaluate(services, input, {
    skipGoPlusIfUnavailable: true,
    skipLlm: true,
  });
  return {
    verdict: verdictLabel(result.verdict),
    intentHash: result.intentHash,
    violations: result.violations,
    simulation: {
      ...result.simulation,
      gasEstimate: result.simulation.gasEstimate?.toString(),
    },
    risk: result.risk,
    explanation: result.explanation,
    attestation: null,
    nextStep:
      result.verdict === Verdict.ALLOW || result.verdict === Verdict.WARN
        ? "Call covenant_sign_attestation (hosted COVENANT_API_URL or local attester key) then covenant_request_approval for user wallet signature."
        : undefined,
  };
}

export async function handleSignAttestation(services: PreflightServices, args: unknown) {
  const input = preflightRequestSchema.parse(args);
  const apiUrl =
    services.env.COVENANT_API_URL ??
    process.env.COVENANT_API_URL ??
    "https://covenant-skill.onrender.com";
  const hasLocalAttester = Boolean(services.env.DEPLOYER_PRIVATE_KEY);
  if (!hasLocalAttester) {
    return { ...(await hostedSignAttestation(apiUrl, input) as Record<string, unknown>), source: "hosted" };
  }
  const result = await runPreflight(services, input, { skipGoPlusIfUnavailable: true, skipLlm: true });
  if (!result.attestation) {
    throw new Error(`Cannot sign attestation for verdict ${verdictLabel(result.verdict)}`);
  }
  return {
    verdict: verdictLabel(result.verdict),
    intentHash: result.intentHash,
    attestation: { ...result.attestation, deadline: result.attestation.deadline.toString() },
    source: "local",
  };
}

export async function handleSimulate(clients: ChainClients, args: unknown) {
  const input = simulateRequestSchema.parse(args);
  const result = await simulateIntent(clients, {
    agent: input.intent.agent as `0x${string}`,
    target: input.intent.target as `0x${string}`,
    data: input.intent.data as `0x${string}`,
    value: input.intent.value,
    nonce: input.intent.nonce,
  }, input.from as `0x${string}` | undefined, { estimateGas: input.includeGasEstimate });
  return { ...result, gasEstimate: result.gasEstimate?.toString() };
}

export async function handleVerifyCounterparty(services: PreflightServices, args: unknown) {
  const input = verifyCounterpartySchema.parse(args);
  if (!services.goplus) {
    return {
      status: "skipped",
      message: "GoPlus unavailable without API keys. Set GOPLUS_APP_KEY or use hosted COVENANT_API_URL.",
      address: input.address,
    };
  }
  return services.goplus.assessCounterparty(input.address as `0x${string}`);
}

export async function handleAttestOutcome(clients: ChainClients, args: unknown) {
  const input = attestOutcomeSchema.parse(args);
  const { client: _c, ...contract } = getReputationRegistryRead(
    clients.publicClient,
    clients.contracts.reputationRegistry,
  );
  const hash = await clients.walletClient.writeContract({
    ...contract,
    chain: clients.chain,
    account: clients.attesterAccount,
    functionName: "updateScore",
    args: [input.agent as `0x${string}`, input.score, input.tier, input.decisionIds],
  });
  return { txHash: hash, agent: input.agent, score: input.score.toString(), tier: input.tier };
}

export async function handleGetReceipt(clients: ChainClients, args: unknown) {
  const input = getReceiptSchema.parse(args);
  const receipt = await readDecision(clients, input.decisionId);
  return {
    id: input.decisionId.toString(),
    ...receipt,
    timestamp: receipt.timestamp.toString(),
  };
}

export async function handleReputation(clients: ChainClients, args: unknown) {
  const input = reputationSchema.parse(args);
  try {
    const rep = await readReputation(clients, input.agent as `0x${string}`);
    return {
      status: "ok",
      agent: input.agent,
      score: rep.score.toString(),
      tier: rep.tier,
      updatedAt: rep.updatedAt.toString(),
      source: "pharos",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "unavailable",
      agent: input.agent,
      score: null,
      tier: null,
      updatedAt: null,
      source: "pharos",
      message:
        "Trust Capital RPC read failed. Retry shortly or set PHAROS_RPC_URL to another Atlantic RPC endpoint.",
      detail: /fetch failed|ENOTFOUND|ECONNRESET|ETIMEDOUT|timeout|rate limit|cu limit exceeded/i.test(message)
        ? "rpc_unavailable"
        : message,
    };
  }
}

export async function handleRotateKey(clients: ChainClients, args: unknown) {
  const input = rotateKeySchema.parse(args);
  const wallet = ownerWallet(clients, input.ownerPrivateKey as `0x${string}`);
  const { client: _c, ...contract } = getIdentityRegistryRead(
    clients.publicClient,
    clients.contracts.identityRegistry,
  );
  const hash = await wallet.writeContract({
    ...contract,
    chain: clients.chain,
    functionName: "rotateKey",
    args: [input.newAgent as `0x${string}`],
  });
  return { txHash: hash, newAgent: input.newAgent };
}

export async function handleHealth(clients: ChainClients) {
  return {
    status: "ok",
    chainId: clients.chain.id,
    attesterAddress: clients.attesterAccount.address,
    mode: "zero-rpc-fast",
    message: "MCP server loaded. Use covenant_simulate or covenant_reputation to verify live RPC reads.",
  };
}

export {
  toolDefinitions,
  toolAliases,
  resolveToolName,
  MCP_SERVER_INSTRUCTIONS,
  type ToolName,
} from "../mcp/definitions.js";

import type { ToolName } from "../mcp/definitions.js";

export async function dispatchTool(
  name: ToolName,
  args: unknown,
  ctx: { clients: ChainClients; services: PreflightServices },
): Promise<unknown> {
  switch (name) {
    case "covenant_health":
      return handleHealth(ctx.clients);
    case "covenant_register_identity":
      return handleRegisterIdentity(ctx.clients, args);
    case "covenant_set_covenant":
      return handleSetCovenant(ctx.clients, args);
    case "covenant_preflight":
      return handlePreflight(ctx.services, args);
    case "covenant_sign_attestation":
      return handleSignAttestation(ctx.services, args);
    case "covenant_simulate":
      return handleSimulate(ctx.clients, args);
    case "covenant_verify_counterparty":
      return handleVerifyCounterparty(ctx.services, args);
    case "covenant_connect_wallet":
      return handleConnectWallet(args);
    case "covenant_create_session":
      return handleCreateSession(args);
    case "covenant_request_approval":
      return handleRequestApproval(args);
    case "covenant_get_pending_approvals":
      return handleGetPendingApprovals(args);
    case "covenant_execute_authorized":
      return handleExecuteAuthorized(args);
    case "covenant_revoke_session":
      return handleRevokeSession(args);
    case "covenant_attest_outcome":
      return handleAttestOutcome(ctx.clients, args);
    case "covenant_get_receipt":
      return handleGetReceipt(ctx.clients, args);
    case "covenant_reputation":
      return handleReputation(ctx.clients, args);
    case "covenant_rotate_key":
      return handleRotateKey(ctx.clients, args);
    default: {
      const _exhaustive: never = name;
      throw new Error(`Unknown tool: ${_exhaustive}`);
    }
  }
}

export type { Hash } from "viem";
