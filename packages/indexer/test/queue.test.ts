import { describe, expect, it } from "vitest";
import { jobIdForLog, parseJobId } from "../src/types.js";

describe("queue job ids", () => {
  it("keys jobs by tx_hash and log_index", () => {
    const id = jobIdForLog("0xAbCd", 3);
    expect(id).toBe("0xabcd-3");
    expect(parseJobId(id)).toEqual({ txHash: "0xabcd", logIndex: 3 });
  });

  it("normalizes tx hash casing in job id", () => {
    expect(jobIdForLog("0xABCDEF", 0)).toBe("0xabcdef-0");
  });
});
