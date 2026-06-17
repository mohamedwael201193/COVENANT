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
}

export async function readAgentOnChainStatus(
  agent: Hex,
  wallet: Hex,
): Promise<AgentOnChainStatus> {
  const owner = (await publicClient.readContract({
    address: CONTRACTS.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "ownerOfAgent",
    args: [agent],
  })) as Hex;

  const zero = "0x0000000000000000000000000000000000000000";
  const registered = owner.toLowerCase() !== zero;
  const active = registered
    ? await publicClient.readContract({
        address: CONTRACTS.identityRegistry,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: "isActive",
        args: [agent],
      })
    : false;

  let covenantHash: Hex | null = null;
  if (registered && owner.toLowerCase() === wallet.toLowerCase()) {
    const stored = await publicClient.readContract({
      address: CONTRACTS.covenantRegistry,
      abi: COVENANT_REGISTRY_ABI,
      functionName: "covenants",
      args: [wallet, agent],
    });
    const hash = stored[0] as Hex;
    covenantHash = hash.toLowerCase() === zero ? null : hash;
  }

  return {
    registered: registered && active,
    active: Boolean(active),
    owner: registered ? owner : null,
    covenantHash,
  };
}

export async function registerAgentOnChain(
  client: WalletClient,
  wallet: Hex,
  agent: Hex,
): Promise<Hex> {
  return client.writeContract({
    address: CONTRACTS.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "register",
    chain: PHAROS_CHAIN,
    account: wallet,
    args: [agent, "ipfs://covenant-agent-proof"],
  } as Parameters<WalletClient["writeContract"]>[0]);
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
  return client.writeContract({
    address: CONTRACTS.covenantRegistry,
    abi: COVENANT_REGISTRY_ABI,
    functionName: "setCovenant",
    chain: PHAROS_CHAIN,
    account: wallet,
    args: [agent, covenantHash, tierCurveRefFromCovenant(covenant), "ipfs://covenant-policy-proof"],
  } as Parameters<WalletClient["writeContract"]>[0]);
}
