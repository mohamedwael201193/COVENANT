import {
  TrustCapitalTier,
  Verdict,
  type CovenantTerms,
  type Intent,
  type PreflightContext,
  type RuleViolation,
} from "@covenant/shared";

function isAddressInList(address: string, list: string[]): boolean {
  const normalized = address.toLowerCase();
  return list.some((a) => a.toLowerCase() === normalized);
}

function effectiveMaxValue(covenant: CovenantTerms, agentTier: TrustCapitalTier): bigint {
  let cap = BigInt(covenant.baseMaxValueWei);
  for (const limit of covenant.tierLimits) {
    if (limit.tier <= agentTier) {
      const tierCap = BigInt(limit.maxValueWei);
      if (tierCap < cap) {
        cap = tierCap;
      }
    }
  }
  return cap;
}

function isWithinTimeWindow(windows: CovenantTerms["timeWindows"], now: Date): boolean {
  if (windows.length === 0) {
    return true;
  }
  const hour = now.getUTCHours();
  return windows.some((w: CovenantTerms["timeWindows"][number]) => {
    if (w.startHourUtc <= w.endHourUtc) {
      return hour >= w.startHourUtc && hour <= w.endHourUtc;
    }
    return hour >= w.startHourUtc || hour <= w.endHourUtc;
  });
}

export interface RulesEvaluation {
  violations: RuleViolation[];
  verdict: Verdict;
}

export function evaluateRules(
  ctx: PreflightContext,
  agentTier: TrustCapitalTier = TrustCapitalTier.BRONZE,
): RulesEvaluation {
  const violations: RuleViolation[] = [];
  const { intent, covenant } = ctx;
  const now = ctx.nowUtc ?? new Date();

  if (intent.agent.toLowerCase() !== covenant.agent.toLowerCase()) {
    violations.push({
      code: "AGENT_MISMATCH",
      message: "Intent agent does not match covenant agent",
      severity: "deny",
    });
  }

  if (covenant.denylist.length > 0 && isAddressInList(intent.target, covenant.denylist)) {
    violations.push({
      code: "DENYLIST_HIT",
      message: `Target ${intent.target} is on covenant denylist`,
      severity: "deny",
    });
  }

  if (covenant.allowlist.length > 0 && !isAddressInList(intent.target, covenant.allowlist)) {
    violations.push({
      code: "ALLOWLIST_MISS",
      message: `Target ${intent.target} is not on covenant allowlist`,
      severity: "deny",
    });
  }

  const maxValue = effectiveMaxValue(covenant, agentTier);
  if (intent.value > maxValue) {
    violations.push({
      code: "VALUE_CAP_EXCEEDED",
      message: `Intent value ${intent.value} exceeds tier cap ${maxValue}`,
      severity: "deny",
    });
  }

  if (!isWithinTimeWindow(covenant.timeWindows, now)) {
    violations.push({
      code: "TIME_WINDOW",
      message: "Current UTC hour is outside allowed covenant time windows",
      severity: "deny",
    });
  }

  if (
    ctx.counterpartyTier !== undefined &&
    ctx.counterpartyTier < covenant.minCounterpartyTier
  ) {
    violations.push({
      code: "MIN_COUNTERPARTY_TIER",
      message: `Counterparty tier ${ctx.counterpartyTier} below minimum ${covenant.minCounterpartyTier}`,
      severity: "deny",
    });
  }

  const hasDeny = violations.some((v) => v.severity === "deny");
  const hasWarn = violations.some((v) => v.severity === "warn");

  let verdict = Verdict.ALLOW;
  if (hasDeny) {
    verdict = Verdict.DENY;
  } else if (hasWarn) {
    verdict = Verdict.WARN;
  }

  return { violations, verdict };
}

export function mergeVerdicts(...verdicts: Verdict[]): Verdict {
  if (verdicts.some((v) => v === Verdict.DENY)) {
    return Verdict.DENY;
  }
  if (verdicts.some((v) => v === Verdict.WARN)) {
    return Verdict.WARN;
  }
  return Verdict.ALLOW;
}

export function validateIntentShape(intent: Intent): RuleViolation[] {
  const violations: RuleViolation[] = [];
  if (intent.data.length > 65_536) {
    violations.push({
      code: "CALldata_TOO_LARGE",
      message: "Calldata exceeds 64KB limit",
      severity: "deny",
    });
  }
  return violations;
}

export { effectiveMaxValue, isWithinTimeWindow };
