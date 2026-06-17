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
import type { PreflightServices } from "../engine/preflight.js";
import { runPreflight } from "../engine/preflight.js";
import { GoPlusClient } from "../engine/riskRead.goplus.js";
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
import { collectHealthState } from "../http/health.js";

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
  const result = await runPreflight(services, input);
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
    attestation: result.attestation
      ? { ...result.attestation, deadline: result.attestation.deadline.toString() }
      : undefined,
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
  }, input.from as `0x${string}` | undefined);
  return { ...result, gasEstimate: result.gasEstimate?.toString() };
}

export async function handleVerifyCounterparty(env: PreflightServices["env"], args: unknown) {
  const input = verifyCounterpartySchema.parse(args);
  const goplus = new GoPlusClient(env);
  const signal = await goplus.assessCounterparty(input.address as `0x${string}`);
  return signal;
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
  const rep = await readReputation(clients, input.agent as `0x${string}`);
  return {
    agent: input.agent,
    score: rep.score.toString(),
    tier: rep.tier,
    updatedAt: rep.updatedAt.toString(),
  };
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
  try {
    const health = await collectHealthState(clients);
    return {
      status: health.attesterMatch ? "ok" : "degraded",
      attesterMatch: health.attesterMatch,
      attesterBalanceWei: health.attesterBalance.toString(),
      chainId: clients.chain.id,
      blockNumber: health.rpc.blockNumber.toString(),
    };
  } catch {
    const { probeRpcCapabilities } = await import("../engine/simulator.js");
    const rpc = await probeRpcCapabilities(clients.publicClient);
    return {
      status: rpc.ethCall ? "ok" : "degraded",
      mode: "read-only",
      chainId: clients.chain.id,
      blockNumber: rpc.blockNumber.toString(),
      ethCall: rpc.ethCall,
    };
  }
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
    case "covenant_simulate":
      return handleSimulate(ctx.clients, args);
    case "covenant_verify_counterparty":
      return handleVerifyCounterparty(ctx.services.env, args);
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
