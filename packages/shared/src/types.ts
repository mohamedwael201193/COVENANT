import type { Address, Hex } from "viem";

/** Matches IDecisionLog.Verdict */
export enum Verdict {
  DENY = 0,
  WARN = 1,
  ALLOW = 2,
}

/** On-chain intent shape (IGuardedExecutor.Intent) */
export interface Intent {
  agent: Address;
  target: Address;
  data: Hex;
  value: bigint;
  nonce: bigint;
}

/** EIP-712 AllowAttestation payload signed by the attester oracle */
export interface AllowAttestation {
  agent: Address;
  intentHash: Hex;
  covenantHash: Hex;
  verdict: Verdict;
  deadline: bigint;
}

/** Signed attestation components for GuardedExecutor.execute */
export interface SignedAllowAttestation extends AllowAttestation {
  v: number;
  r: Hex;
  s: Hex;
}

/** Trust Capital tier (0 = untrusted, 4 = highest) */
export enum TrustCapitalTier {
  UNTRUSTED = 0,
  BRONZE = 1,
  SILVER = 2,
  GOLD = 3,
  PLATINUM = 4,
}

/** Per-tier value cap in wei (native PHRS) */
export interface TierLimit {
  tier: TrustCapitalTier;
  maxValueWei: string;
}

/** Time window restriction (UTC, inclusive hours 0-23) */
export interface TimeWindow {
  startHourUtc: number;
  endHourUtc: number;
}

/** Full covenant policy stored off-chain (IPFS); only hash on-chain */
export interface CovenantTerms {
  version: "1";
  agent: Address;
  owner: Address;
  /** keccak256 of this JSON (canonical) — must match on-chain covenantHash */
  allowlist: Address[];
  denylist: Address[];
  /** Max native value per intent (wei string) before tier scaling */
  baseMaxValueWei: string;
  /** Tier-scaled limits; effective cap = min(base, tier curve) */
  tierLimits: TierLimit[];
  /** Minimum counterparty TC tier when target is a known agent */
  minCounterpartyTier: TrustCapitalTier;
  /** Allowed execution hours (UTC); empty = always allowed */
  timeWindows: TimeWindow[];
  /** Require GoPlus + simulation before ALLOW */
  requiredChecks: ("simulation" | "goplus")[];
  /** Human-readable label */
  label?: string;
  createdAt: string;
}

export interface DecisionReceipt {
  id: bigint;
  agent: Address;
  intentHash: Hex;
  verdict: Verdict;
  reasonHash: Hex;
  outcomeHash: Hex;
  timestamp: bigint;
}

export interface ReputationSnapshot {
  agent: Address;
  score: bigint;
  tier: TrustCapitalTier;
  updatedAt: bigint;
}

export interface PreflightContext {
  intent: Intent;
  covenant: CovenantTerms;
  covenantHash: Hex;
  counterpartyTier?: TrustCapitalTier;
  counterpartyScore?: bigint;
  nowUtc?: Date;
}

export interface RuleViolation {
  code: string;
  message: string;
  severity: "deny" | "warn";
}

export interface SimulationResult {
  success: boolean;
  returnData?: Hex;
  gasEstimate?: bigint;
  revertReason?: string;
  traceAvailable: boolean;
}

export interface RiskSignal {
  source: "goplus";
  status: "safe" | "warn" | "malicious" | "unknown";
  details: Record<string, string | number | boolean | null>;
}

export interface PreflightResult {
  verdict: Verdict;
  intentHash: Hex;
  violations: RuleViolation[];
  simulation: SimulationResult;
  risk?: RiskSignal;
  explanation?: string;
  attestation?: SignedAllowAttestation;
}

export interface LlmExplanation {
  summary: string;
  intentClassification: string;
  anomalyFlag: boolean;
  /** LLM must never set verdict to ALLOW */
  suggestedVerdict?: Verdict.DENY | Verdict.WARN;
}
