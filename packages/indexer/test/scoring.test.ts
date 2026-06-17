import { describe, expect, it } from "vitest";
import { Verdict } from "covenant-shared";
import {
  applyBreachSlash,
  applyVerdictDelta,
  BREACH_SLASH,
  proposeScoreAfterDecision,
  scoreToTier,
} from "../src/scoring/oracle.js";

describe("scoring oracle", () => {
  it("accrues TC on ALLOW verdict", () => {
    const proposal = proposeScoreAfterDecision("0xabc", "1", Verdict.ALLOW, 100n);
    expect(proposal.score).toBe(110n);
    expect(proposal.tier).toBe(1);
  });

  it("accrues smaller delta on DENY", () => {
    expect(applyVerdictDelta(50n, Verdict.DENY)).toBe(55n);
  });

  it("slashes on breach", () => {
    expect(applyBreachSlash(100n)).toBe(100n - BREACH_SLASH);
    expect(applyBreachSlash(10n)).toBe(0n);
  });

  it("maps score to tier thresholds", () => {
    expect(scoreToTier(0n)).toBe(0);
    expect(scoreToTier(50n)).toBe(1);
    expect(scoreToTier(200n)).toBe(2);
    expect(scoreToTier(500n)).toBe(3);
    expect(scoreToTier(1000n)).toBe(4);
  });
});
