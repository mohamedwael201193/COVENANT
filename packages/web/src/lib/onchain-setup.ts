import { createPublicClient, http, keccak256, type Hex, type WalletClient } from "viem";
import {
  CONTRACTS,
  COVENANT_REGISTRY_ABI,
  IDENTITY_REGISTRY_ABI,
  PHAROS_CHAIN,
  PHAROS_RPC,
} from "./pharos";

const publicClient = createPublicClient({ chain: PHAROS_CHAIN, transport: http(PHAROS_RPC) });

export interface AgentOnChainStatus {
  registered: boolean;
  active: boolean;
  owner: Hex | null;
  covenantHash: Hex | null;
  /** Agent key already linked to this owner in IdentityRegistry */
  linkedAgent: Hex | null;
}

export async function readAgentOnChainStatus(
  agent: Hex,
  wallet: Hex,
): Promise<AgentOnChainStatus> {
  const zero = "0x0000000000000000000000000000000000000000" as Hex;

  const linkedAgent = (await publicClient.readContract({
    address: CONTRACTS.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "agentOfOwner",
    args: [wallet],
  })) as Hex;

  const effectiveAgent =
    linkedAgent.toLowerCase() !== zero.toLowerCase() ? linkedAgent : agent;

  const owner = (await publicClient.readContract({
    address: CONTRACTS.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "ownerOfAgent",
    args: [effectiveAgent],
  })) as Hex;

  const registered = owner.toLowerCase() !== zero.toLowerCase();
  const active = registered
    ? await publicClient.readContract({
        address: CONTRACTS.identityRegistry,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: "isActive",
        args: [effectiveAgent],
      })
    : false;

  let covenantHash: Hex | null = null;
  if (registered && owner.toLowerCase() === wallet.toLowerCase()) {
    const stored = await publicClient.readContract({
      address: CONTRACTS.covenantRegistry,
      abi: COVENANT_REGISTRY_ABI,
      functionName: "covenants",
      args: [wallet, effectiveAgent],
    });
    const hash = stored[0] as Hex;
    covenantHash = hash.toLowerCase() === zero.toLowerCase() ? null : hash;
  }

  return {
    registered: registered && active,
    active: Boolean(active),
    owner: registered ? owner : null,
    covenantHash,
    linkedAgent: linkedAgent.toLowerCase() !== zero.toLowerCase() ? linkedAgent : null,
  };
}

async function writeWithGasCap(
  client: WalletClient,
  request: Parameters<WalletClient["writeContract"]>[0],
  gasFallback = 300_000n,
): Promise<Hex> {
  const publicClient = createPublicClient({ chain: PHAROS_CHAIN, transport: http(PHAROS_RPC) });
  try {
    await publicClient.simulateContract(request as never);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(message);
  }

  let gas = gasFallback;
  try {
    const estimated = await publicClient.estimateContractGas(request as never);
    gas = estimated > 2_000_000n ? 2_000_000n : estimated;
  } catch {
    gas = gasFallback;
  }

  return client.writeContract({ ...request, gas } as Parameters<WalletClient["writeContract"]>[0]);
}

export async function registerAgentOnChain(
  client: WalletClient,
  wallet: Hex,
  agent: Hex,
): Promise<Hex> {
  const linked = (await publicClient.readContract({
    address: CONTRACTS.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "agentOfOwner",
    args: [wallet],
  })) as Hex;
  const zero = "0x0000000000000000000000000000000000000000";
  if (linked.toLowerCase() !== zero) {
    throw new Error(
      `This wallet already owns agent ${linked}. Use that agent for approvals — do not register again.`,
    );
  }

  return writeWithGasCap(client, {
    address: CONTRACTS.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "register",
    chain: PHAROS_CHAIN,
    account: wallet,
    args: [agent, "ipfs://covenant-agent-proof"],
  });
}

export function tierCurveRefFromCovenant(covenant: { tierLimits?: { tier: number; maxValueWei: string }[] }): Hex {
  return keccak256(new TextEncoder().encode(JSON.stringify(covenant.tierLimits ?? [])));
}

export async function publishCovenantOnChain(
  client: WalletClient,
  wallet: Hex,
  agent: Hex,
  covenantHash: Hex,
  covenant: { tierLimits?: { tier: number; maxValueWei: string }[] },
): Promise<Hex> {
  return writeWithGasCap(client, {
    address: CONTRACTS.covenantRegistry,
    abi: COVENANT_REGISTRY_ABI,
    functionName: "setCovenant",
    chain: PHAROS_CHAIN,
    account: wallet,
    args: [agent, covenantHash, tierCurveRefFromCovenant(covenant), "ipfs://covenant-policy-proof"],
  });
}
