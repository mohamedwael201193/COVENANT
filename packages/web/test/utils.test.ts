import { describe, expect, it } from "vitest";
import { explorerTxUrl, tierName, truncateAddress } from "@/lib/utils";

describe("utils", () => {
  it("truncates addresses", () => {
    expect(truncateAddress("0x1234567890123456789012345678901234567890", 4)).toBe(
      "0x1234…7890",
    );
  });

  it("maps tier names", () => {
    expect(tierName(3)).toBe("GOLD");
  });

  it("builds explorer URLs", () => {
    expect(explorerTxUrl("0xabc")).toBe("https://atlantic.pharosscan.xyz/tx/0xabc");
  });
});

describe("api base", () => {
  it("defaults VITE_API_URL to /api", () => {
    expect(import.meta.env.VITE_API_URL ?? "/api").toBe("/api");
  });
});
