/** Pharos Atlantic chain config for wallet UX */
export const PHAROS_CHAIN_ID = 688689;
export const PHAROS_CHAIN_ID_HEX = "0xa81a1" as const;

export const PHAROS_RPC = "https://atlantic.dplabs-internal.com";

export const CONTRACTS = {
  guardedExecutor: "0x2741bAF6F51e5Ab67E81DdDCb1439679Bebd2d2F" as const,
  decisionLog: "0x8A80D270dd7028536ecB6f92b04eec11F929d603" as const,
};

export const GUARDED_EXECUTOR_ABI = [
  {
    type: "function",
    name: "execute",
    inputs: [
      {
        name: "intent",
        type: "tuple",
        components: [
          { name: "agent", type: "address" },
          { name: "target", type: "address" },
          { name: "data", type: "bytes" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      },
      { name: "covenantHash", type: "bytes32" },
      { name: "deadline", type: "uint256" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
] as const;

export const DECISION_LOG_ABI = [
  {
    type: "event",
    name: "DecisionLogged",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "agent", type: "address", indexed: true },
      { name: "intentHash", type: "bytes32", indexed: true },
    ],
  },
] as const;

export const PHAROS_CHAIN = {
  id: PHAROS_CHAIN_ID,
  name: "Pharos Atlantic",
  nativeCurrency: { name: "PHRS", symbol: "PHRS", decimals: 18 },
  rpcUrls: { default: { http: [PHAROS_RPC] } },
} as const;
