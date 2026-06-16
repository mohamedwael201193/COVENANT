import { describe, expect, it } from "vitest";
import { isCertikConfigured, runCertikScan, waitingResult } from "../src/adapter.js";

describe("certik adapter", () => {
  it("returns WAITING_FOR_OFFICIAL_ACCESS when disabled", async () => {
    const result = await runCertikScan(
      { enabled: false, scannerUrl: "", apiKey: "" },
      { repositoryRoot: process.cwd() },
    );
    expect(result.status).toBe("WAITING_FOR_OFFICIAL_ACCESS");
    expect(result.findings).toEqual([]);
  });

  it("returns WAITING_FOR_OFFICIAL_ACCESS when enabled but unconfigured", async () => {
    const result = await runCertikScan(
      { enabled: true, scannerUrl: "", apiKey: "" },
      { repositoryRoot: process.cwd() },
    );
    expect(result.status).toBe("WAITING_FOR_OFFICIAL_ACCESS");
  });

  it("detects configured state only when all fields present", () => {
    expect(isCertikConfigured({ enabled: false, scannerUrl: "https://x", apiKey: "k" })).toBe(false);
    expect(isCertikConfigured({ enabled: true, scannerUrl: "", apiKey: "k" })).toBe(false);
    expect(isCertikConfigured({ enabled: true, scannerUrl: "https://x", apiKey: "k" })).toBe(true);
  });

  it("waitingResult uses default message", () => {
    const result = waitingResult();
    expect(result.status).toBe("WAITING_FOR_OFFICIAL_ACCESS");
    expect(result.message).toContain("CertiK");
  });
});
