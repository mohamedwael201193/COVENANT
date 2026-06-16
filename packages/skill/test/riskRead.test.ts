import { describe, expect, it } from "vitest";
import { riskToVerdictDowngrade } from "../src/engine/riskRead.goplus.js";

describe("GoPlus verdict downgrade", () => {
  it("malicious maps to deny", () => {
    expect(riskToVerdictDowngrade({ source: "goplus", status: "malicious", details: {} })).toBe(
      "deny",
    );
  });

  it("unknown does not downgrade", () => {
    expect(riskToVerdictDowngrade({ source: "goplus", status: "unknown", details: {} })).toBeNull();
  });
});
