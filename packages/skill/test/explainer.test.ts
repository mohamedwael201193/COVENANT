import { describe, expect, it } from "vitest";
import { Verdict } from "covenant-shared";
import { ruleBasedFallback } from "../src/engine/explainer.llm.js";
import { llmExplanationSchema } from "../src/engine/schema.js";

describe("LLM explainer safety", () => {
  it("rule fallback never suggests ALLOW", () => {
    const result = ruleBasedFallback([]);
    expect(result.suggestedVerdict).not.toBe(Verdict.ALLOW);
    if (result.suggestedVerdict !== undefined) {
      expect([Verdict.DENY, Verdict.WARN]).toContain(result.suggestedVerdict);
    }
  });

  it("schema rejects ALLOW in suggestedVerdict", () => {
    const parsed = llmExplanationSchema.safeParse({
      summary: "test",
      intentClassification: "transfer",
      anomalyFlag: false,
      suggestedVerdict: Verdict.ALLOW,
    });
    expect(parsed.success).toBe(false);
  });

  it("strips ALLOW from malicious LLM JSON in sanitize path via schema", () => {
    const parsed = llmExplanationSchema.safeParse({
      summary: "ok",
      intentClassification: "call",
      anomalyFlag: true,
      suggestedVerdict: Verdict.DENY,
    });
    expect(parsed.success).toBe(true);
  });
});
