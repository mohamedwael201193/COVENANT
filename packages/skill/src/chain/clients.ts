import {
  createPublicClient,
  createWalletClient,
  fallback,
  http,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  type Transport,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  abis,
  loadChainConfig,
  PHAROS_ATLANTIC_CHAIN_ID,
} from "covenant-shared";
import type { EnvConfig } from "../config.js";

function buildChain(config: ReturnType<typeof loadChainConfig>): Chain {
  return {
    id: config.chainId,
    name: config.name,
    nativeCurrency: config.nativeCurrency,
    rpcUrls: config.rpcUrls,
  };
}

export interface ChainClients {
  publicClient: PublicClient;
  walletClient: WalletClient;
  attesterAccount: ReturnType<typeof privateKeyToAccount>;
  contracts: ReturnType<typeof loadChainConfig>["contracts"];
  chain: Chain;
}

function buildRpcTransport(rpcUrls: string[]): Transport {
  const urls = rpcUrls.filter(Boolean);
  if (urls.length > 1) {
    return fallback(urls.map((url) => http(url)));
  }
  return http(urls[0]!);
}

export function createPublicChainClients(config: {
  PHAROS_RPC_URL: string;
  PHAROS_RPC_URL_FALLBACK?: string;
  PHAROS_CHAIN_ID: number;
}): Pick<ChainClients, "publicClient" | "contracts" | "chain"> {
  process.env.PHAROS_RPC_URL = config.PHAROS_RPC_URL;
  if (config.PHAROS_RPC_URL_FALLBACK) {
    process.env.PHAROS_RPC_URL_FALLBACK = config.PHAROS_RPC_URL_FALLBACK;
  }
  process.env.PHAROS_CHAIN_ID = String(config.PHAROS_CHAIN_ID);
  const chainConfig = loadChainConfig(process.env);
  const chain = buildChain(chainConfig);
  const rpcUrls = [config.PHAROS_RPC_URL, config.PHAROS_RPC_URL_FALLBACK].filter(Boolean) as string[];
  const transport = buildRpcTransport([...new Set(rpcUrls)]);
  const publicClient = createPublicClient({ chain, transport });
  return { publicClient, contracts: chainConfig.contracts, chain };
}

export function createChainClients(env: EnvConfig): ChainClients {
  const chainConfig = loadChainConfig(process.env);
  const chain = buildChain(chainConfig);
  const rpcUrls = [
    env.PHAROS_RPC_URL,
    env.PHAROS_RPC_URL_FALLBACK,
    ...(chainConfig.rpcUrls.fallback?.http ?? []),
  ].filter(Boolean) as string[];
  const uniqueUrls = [...new Set(rpcUrls)];
  const transport = buildRpcTransport(uniqueUrls);

  const publicClient = createPublicClient({ chain, transport });
  const attesterAccount = privateKeyToAccount(env.DEPLOYER_PRIVATE_KEY);
  const walletClient = createWalletClient({
    chain,
    transport,
    account: attesterAccount,
  });

  return {
    publicClient,
    walletClient,
    attesterAccount,
    contracts: chainConfig.contracts,
    chain,
  };
}

export function getIdentityRegistryRead(client: PublicClient, address: Address) {
  return { address, abi: abis.identityRegistry, client } as const;
}

export function getCovenantRegistryRead(client: PublicClient, address: Address) {
  return { address, abi: abis.covenantRegistry, client } as const;
}

export function getDecisionLogRead(client: PublicClient, address: Address) {
  return { address, abi: abis.decisionLog, client } as const;
}

export function getReputationRegistryRead(client: PublicClient, address: Address) {
  return { address, abi: abis.reputationRegistry, client } as const;
}

export function getGuardedExecutorRead(client: PublicClient, address: Address) {
  return { address, abi: abis.guardedExecutor, client } as const;
}

export async function readAttesterOnChain(clients: ChainClients): Promise<Address> {
  return (await clients.publicClient.readContract({
    address: clients.contracts.guardedExecutor,
    abi: abis.guardedExecutor,
    functionName: "attester",
  })) as Address;
}

export async function readReputation(
  clients: ChainClients,
  agent: Address,
): Promise<{ score: bigint; tier: number; updatedAt: bigint }> {
  const result = (await clients.publicClient.readContract({
    address: clients.contracts.reputationRegistry,
    abi: abis.reputationRegistry,
    functionName: "reputations",
    args: [agent],
  })) as readonly [bigint, number, bigint];
  const [score, tier, updatedAt] = result;
  return { score, tier, updatedAt };
}

export async function readDecision(
  clients: ChainClients,
  id: bigint,
): Promise<{
  agent: Address;
  intentHash: Hex;
  verdict: number;
  reasonHash: Hex;
  outcomeHash: Hex;
  timestamp: bigint;
}> {
  const result = (await clients.publicClient.readContract({
    address: clients.contracts.decisionLog,
    abi: abis.decisionLog,
    functionName: "decisions",
    args: [id],
  })) as readonly [Address, Hex, number, Hex, Hex, bigint];
  const [agent, intentHash, verdict, reasonHash, outcomeHash, timestamp] = result;
  return { agent, intentHash, verdict, reasonHash, outcomeHash, timestamp };
}

export { PHAROS_ATLANTIC_CHAIN_ID };
