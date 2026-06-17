import { describe, expect, it } from "vitest";
import {
  toolDefinitions,
  toolAliases,
  resolveToolName,
  dispatchTool,
} from "../src/tools/index.js";
import { registerIdentitySchema, preflightRequestSchema } from "../src/engine/schema.js";

const EXPECTED_TOOLS = [
  "covenant_attest_outcome",
  "covenant_get_receipt",
  "covenant_health",
  "covenant_preflight",
  "covenant_register_identity",
  "covenant_reputation",
  "covenant_rotate_key",
  "covenant_set_covenant",
  "covenant_simulate",
  "covenant_verify_counterparty",
];

describe("MCP tool surface", () => {
  it("exports exactly 10 covenant_* tools with JSON schemas", () => {
    expect(toolDefinitions).toHaveLength(10);
    const names = toolDefinitions.map((t) => t.name).sort();
    expect(names).toEqual(EXPECTED_TOOLS.sort());
    for (const tool of toolDefinitions) {
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.description.length).toBeGreaterThan(40);
      expect(tool.description.toLowerCase()).toMatch(/use|do not/);
    }
  });

  it("resolves legacy aliases to covenant_* names", () => {
    expect(resolveToolName("preflight")).toBe("covenant_preflight");
    expect(resolveToolName("reputation")).toBe("covenant_reputation");
    expect(Object.keys(toolAliases)).toHaveLength(9);
  });

  it("all tools are discoverable via unique names", () => {
    const set = new Set(toolDefinitions.map((t) => t.name));
    expect(set.size).toBe(10);
    for (const name of EXPECTED_TOOLS) {
      expect(set.has(name)).toBe(true);
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
      dispatchTool("covenant_unknown" as never, {}, {
        clients: {} as never,
        services: {} as never,
      }),
    ).rejects.toThrow();
  });
});
