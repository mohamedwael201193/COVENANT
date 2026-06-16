import type { Address } from "viem";

/** Pharos Atlantic testnet */
export const PHAROS_ATLANTIC_CHAIN_ID = 688689;

/** Block number of initial contract deployment on Atlantic testnet */
export const DEFAULT_INDEXER_START_BLOCK = 24_340_730n;

export const DEFAULT_RPC_URL =
  "https://api.zan.top/node/v1/pharos/atlantic/eba2f87ee4174f41bac3cc6bfc02a4d1";

export const DEFAULT_CONTRACTS = {
  identityRegistry: "0x05545F026b75f03aE9Cf1eA8a8373473c94ed323" as Address,
  covenantRegistry: "0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770" as Address,
  decisionLog: "0x8A80D270dd7028536ecB6f92b04eec11F929d603" as Address,
  reputationRegistry: "0x92b8815A17D85E45DB5Da9952764Ee2ce072A973" as Address,
  guardedExecutor: "0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F" as Address,
  attester: "0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3" as Address,
} as const;

export interface ChainConfig {
  chainId: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: { default: { http: string[] }; fallback?: { http: string[] } };
  blockExplorers: { default: { name: string; url: string } };
  contracts: typeof DEFAULT_CONTRACTS;
}

function envOrDefault(env: NodeJS.ProcessEnv, key: string, fallback: string): string {
  const value = env[key]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function envAddressOrDefault(env: NodeJS.ProcessEnv, key: string, fallback: Address): Address {
  const value = env[key]?.trim();
  if (!value || value.length === 0) {
    return fallback;
  }
  return value as Address;
}

export function getIndexerStartBlock(env: NodeJS.ProcessEnv = process.env): bigint {
  const raw = env.INDEXER_START_BLOCK?.trim();
  if (raw && raw !== "0") {
    return BigInt(raw);
  }
  return DEFAULT_INDEXER_START_BLOCK;
}

export function loadChainConfig(env: NodeJS.ProcessEnv = process.env): ChainConfig {
  const rpcPrimary = envOrDefault(env, "PHAROS_RPC_URL", DEFAULT_RPC_URL);
  const rpcFallback = envOrDefault(env, "PHAROS_RPC_URL_FALLBACK", "");
  const explorer = envOrDefault(env, "PHAROS_EXPLORER_URL", "https://atlantic.pharosscan.xyz");

  const httpUrls = [rpcPrimary];
  if (rpcFallback) {
    httpUrls.push(rpcFallback);
  }

  return {
    chainId: Number(envOrDefault(env, "PHAROS_CHAIN_ID", String(PHAROS_ATLANTIC_CHAIN_ID))),
    name: "Pharos Atlantic Testnet",
    nativeCurrency: { name: "PHRS", symbol: "PHRS", decimals: 18 },
    rpcUrls: {
      default: { http: httpUrls },
      ...(rpcFallback ? { fallback: { http: [rpcFallback] } } : {}),
    },
    blockExplorers: {
      default: { name: "PharosScan", url: explorer },
    },
    contracts: {
      identityRegistry: envAddressOrDefault(
        env,
        "IDENTITY_REGISTRY_ADDRESS",
        DEFAULT_CONTRACTS.identityRegistry,
      ),
      covenantRegistry: envAddressOrDefault(
        env,
        "COVENANT_REGISTRY_ADDRESS",
        DEFAULT_CONTRACTS.covenantRegistry,
      ),
      decisionLog: envAddressOrDefault(env, "DECISION_LOG_ADDRESS", DEFAULT_CONTRACTS.decisionLog),
      reputationRegistry: envAddressOrDefault(
        env,
        "REPUTATION_REGISTRY_ADDRESS",
        DEFAULT_CONTRACTS.reputationRegistry,
      ),
      guardedExecutor: envAddressOrDefault(
        env,
        "GUARDED_EXECUTOR_ADDRESS",
        DEFAULT_CONTRACTS.guardedExecutor,
      ),
      attester: envAddressOrDefault(env, "ATTESTER_ADDRESS", DEFAULT_CONTRACTS.attester),
    },
  };
}

export const pharosAtlanticChain = loadChainConfig();
