import { describe, expect, it } from "vitest";
import {
  TrustCapitalTier,
  Verdict,
  type CovenantTerms,
  type Intent,
} from "covenant-shared";
import { evaluateRules, mergeVerdicts } from "../src/engine/rules.js";

const AGENT = "0x1111111111111111111111111111111111111111" as const;
const TARGET = "0x2222222222222222222222222222222222222222" as const;
const DENIED = "0x3333333333333333333333333333333333333333" as const;

function baseCovenant(overrides: Partial<CovenantTerms> = {}): CovenantTerms {
  return {
    version: "1",
    agent: AGENT,
    owner: "0x4444444444444444444444444444444444444444",
    allowlist: [TARGET],
    denylist: [DENIED],
    baseMaxValueWei: "1000000000000000000",
    tierLimits: [{ tier: TrustCapitalTier.BRONZE, maxValueWei: "1000000000000000000" }],
    minCounterpartyTier: TrustCapitalTier.UNTRUSTED,
    timeWindows: [],
    requiredChecks: ["simulation"],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function baseIntent(overrides: Partial<Intent> = {}): Intent {
  return {
    agent: AGENT,
    target: TARGET,
    data: "0x",
    value: 1n,
    nonce: 1n,
    ...overrides,
  };
}

describe("evaluateRules", () => {
  it("ALLOW when intent satisfies covenant", () => {
    const result = evaluateRules({
      intent: baseIntent(),
      covenant: baseCovenant(),
      covenantHash: "0x" + "aa".repeat(32),
    });
    expect(result.verdict).toBe(Verdict.ALLOW);
    expect(result.violations).toHaveLength(0);
  });

  it("DENY when target is on denylist", () => {
    const result = evaluateRules({
      intent: baseIntent({ target: DENIED }),
      covenant: baseCovenant({ allowlist: [] }),
      covenantHash: "0x" + "bb".repeat(32),
    });
    expect(result.verdict).toBe(Verdict.DENY);
    expect(result.violations.some((v) => v.code === "DENYLIST_HIT")).toBe(true);
  });

  it("DENY when value exceeds tier cap", () => {
    const result = evaluateRules({
      intent: baseIntent({ value: 2_000_000_000_000_000_000n }),
      covenant: baseCovenant(),
      covenantHash: "0x" + "cc".repeat(32),
    });
    expect(result.verdict).toBe(Verdict.DENY);
    expect(result.violations.some((v) => v.code === "VALUE_CAP_EXCEEDED")).toBe(true);
  });
});

describe("mergeVerdicts", () => {
  it("prefers DENY over WARN and ALLOW", () => {
    expect(mergeVerdicts(Verdict.ALLOW, Verdict.WARN, Verdict.DENY)).toBe(Verdict.DENY);
  });
});
