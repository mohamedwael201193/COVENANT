import { describe, expect, it } from "vitest";
import { toolDefinitions, dispatchTool } from "../src/tools/index.js";
import { registerIdentitySchema, preflightRequestSchema } from "../src/engine/schema.js";

describe("MCP tool surface", () => {
  it("exports exactly 9 tools with JSON schemas", () => {
    expect(toolDefinitions).toHaveLength(9);
    const names = toolDefinitions.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        "attestOutcome",
        "getReceipt",
        "preflight",
        "registerIdentity",
        "reputation",
        "rotateKey",
        "setCovenant",
        "simulate",
        "verifyCounterparty",
      ].sort(),
    );
    for (const tool of toolDefinitions) {
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.description.length).toBeGreaterThan(10);
    }
  });

  it("rejects invalid registerIdentity args via zod", () => {
    expect(() => registerIdentitySchema.parse({ agent: "not-an-address" })).toThrow();
  });

  it("rejects invalid preflight args via zod", () => {
    expect(() =>
      preflightRequestSchema.parse({
        agent: "0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3",
        target: "bad",
        data: "0x",
        value: "0",
        nonce: "1",
        covenantHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      }),
    ).toThrow();
  });

  it("dispatchTool throws for unknown tool name", async () => {
    await expect(
      dispatchTool("unknownTool" as never, {}, {
        clients: {} as never,
        services: {} as never,
      }),
    ).rejects.toThrow();
  });
});
