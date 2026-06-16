import { TrustCapitalTier, Verdict } from "@covenant/shared";

/** TC delta applied per decision verdict (deterministic oracle rules). */
export const SCORE_DELTA: Record<number, bigint> = {
  [Verdict.ALLOW]: 10n,
  [Verdict.WARN]: 2n,
  [Verdict.DENY]: 5n,
};

export const BREACH_SLASH = 25n;
export const MIN_SCORE = 0n;

const TIER_THRESHOLDS: Array<{ min: bigint; tier: TrustCapitalTier }> = [
  { min: 1000n, tier: TrustCapitalTier.PLATINUM },
  { min: 500n, tier: TrustCapitalTier.GOLD },
  { min: 200n, tier: TrustCapitalTier.SILVER },
  { min: 50n, tier: TrustCapitalTier.BRONZE },
  { min: 0n, tier: TrustCapitalTier.UNTRUSTED },
];

export function scoreToTier(score: bigint): TrustCapitalTier {
  for (const { min, tier } of TIER_THRESHOLDS) {
    if (score >= min) return tier;
  }
  return TrustCapitalTier.UNTRUSTED;
}

export function applyVerdictDelta(currentScore: bigint, verdict: number): bigint {
  const delta = SCORE_DELTA[verdict] ?? 0n;
  const next = currentScore + delta;
  return next < MIN_SCORE ? MIN_SCORE : next;
}

export function applyBreachSlash(currentScore: bigint): bigint {
  const next = currentScore > BREACH_SLASH ? currentScore - BREACH_SLASH : MIN_SCORE;
  return next;
}

export interface ScoreProposal {
  agent: string;
  score: bigint;
  tier: number;
  decisionIds: bigint[];
  reason: "decision" | "breach";
}

export function proposeScoreAfterDecision(
  agent: string,
  decisionId: string,
  verdict: number,
  currentScore: bigint,
): ScoreProposal {
  const score = applyVerdictDelta(currentScore, verdict);
  return {
    agent,
    score,
    tier: scoreToTier(score),
    decisionIds: [BigInt(decisionId)],
    reason: "decision",
  };
}

export function proposeScoreAfterBreach(
  agent: string,
  relatedDecisionIds: string[],
  currentScore: bigint,
): ScoreProposal | null {
  if (relatedDecisionIds.length === 0) return null;
  const score = applyBreachSlash(currentScore);
  return {
    agent,
    score,
    tier: scoreToTier(score),
    decisionIds: relatedDecisionIds.map((id) => BigInt(id)),
    reason: "breach",
  };
}
