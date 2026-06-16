import { describe, expect, it } from "vitest";
import { assertEgressAllowed, EgressViolationError } from "../src/egress.js";

describe("egress allowlist", () => {
  it("allows Pharos RPC host", () => {
    const hosts = new Set(["api.zan.top"]);
    expect(() =>
      assertEgressAllowed("https://api.zan.top/node/v1/pharos/atlantic/test", hosts),
    ).not.toThrow();
  });

  it("blocks unknown hosts", () => {
    const hosts = new Set(["api.zan.top"]);
    expect(() => assertEgressAllowed("https://evil.example.com/payload", hosts)).toThrow(
      EgressViolationError,
    );
  });
});
