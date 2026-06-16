export * from "./chains.js";
export * from "./types.js";
export * from "./eip712.js";

import identityRegistryAbi from "./abis/IdentityRegistry.json" with { type: "json" };
import covenantRegistryAbi from "./abis/CovenantRegistry.json" with { type: "json" };
import decisionLogAbi from "./abis/DecisionLog.json" with { type: "json" };
import reputationRegistryAbi from "./abis/ReputationRegistry.json" with { type: "json" };
import guardedExecutorAbi from "./abis/GuardedExecutor.json" with { type: "json" };

export const abis = {
  identityRegistry: identityRegistryAbi,
  covenantRegistry: covenantRegistryAbi,
  decisionLog: decisionLogAbi,
  reputationRegistry: reputationRegistryAbi,
  guardedExecutor: guardedExecutorAbi,
} as const;
