import { describe, expect, it } from "vitest";
import { PHAROS_CHAIN_ID, PHAROS_CHAIN_ID_HEX } from "@/lib/pharos";

describe("pharos chain config", () => {
  it("hex chain id matches decimal Pharos Atlantic (688689)", () => {
    expect(Number.parseInt(PHAROS_CHAIN_ID_HEX, 16)).toBe(PHAROS_CHAIN_ID);
    expect(PHAROS_CHAIN_ID).toBe(688689);
    expect(PHAROS_CHAIN_ID_HEX).toBe("0xa8231");
  });
});
