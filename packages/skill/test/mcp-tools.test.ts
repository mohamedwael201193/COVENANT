import { describe, expect, it, beforeEach } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { toolDefinitions, toolAliases, resolveToolName, dispatchTool } from "../src/tools/index.js";
import { registerIdentitySchema, preflightRequestSchema } from "../src/engine/schema.js";
import { clearSessionStore } from "../src/session/store.js";
import { handleConnectWallet, handleCreateSession } from "../src/session/handlers.js";

const EXPECTED_TOOLS = [
  "covenant_attest_outcome",
  "covenant_connect_wallet",
  "covenant_create_session",
  "covenant_execute_authorized",
  "covenant_get_pending_approvals",
  "covenant_get_receipt",
  "covenant_health",
  "covenant_preflight",
  "covenant_register_identity",
  "covenant_reputation",
  "covenant_request_approval",
  "covenant_revoke_session",
  "covenant_rotate_key",
  "covenant_set_covenant",
  "covenant_sign_attestation",
  "covenant_simulate",
  "covenant_verify_counterparty",
];

describe("MCP tool surface", () => {
  beforeEach(() => {
    process.env.COVENANT_SESSION_STORE = "memory";
    clearSessionStore();
  });

  it("exports 17 covenant_* tools with JSON schemas", () => {
    expect(toolDefinitions).toHaveLength(17);
    const names = toolDefinitions.map((t) => t.name).sort();
    expect(names).toEqual(EXPECTED_TOOLS.sort());
    for (const tool of toolDefinitions) {
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.description.length).toBeGreaterThan(40);
    }
  });

  it("resolves legacy aliases", () => {
    expect(resolveToolName("preflight")).toBe("covenant_preflight");
    expect(resolveToolName("signAttestation")).toBe("covenant_sign_attestation");
    expect(Object.keys(toolAliases).length).toBeGreaterThanOrEqual(9);
  });

  it("session flow without private keys", async () => {
    const account = privateKeyToAccount(
      "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    );
    const wallet = account.address;
    const connect = await handleConnectWallet({ walletAddress: wallet });
    expect(connect.message).toContain("Nonce:");
    const signature = await account.signMessage({ message: connect.message });
    const session = await handleCreateSession({
      walletAddress: wallet,
      signature,
      message: connect.message,
      nonce: connect.nonce,
      permissions: ["preflight", "execute"],
      durationDays: 7,
    });
    expect(session.sessionId).toMatch(/^sess_/);
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

describe("schema validation", () => {
  it("rejects invalid registerIdentity args", () => {
    expect(() => registerIdentitySchema.parse({ agent: "not-an-address" })).toThrow();
  });

  it("rejects invalid preflight args", () => {
    expect(() =>
      preflightRequestSchema.parse({
        intent: {
          agent: "0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3",
          target: "bad",
          data: "0x",
          value: "0",
          nonce: "1",
        },
        covenantHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        covenant: {
          version: "1",
          agent: "0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3",
          owner: "0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3",
          allowlist: [],
          denylist: [],
          baseMaxValueWei: "0",
          minCounterpartyTier: 0,
          requiredChecks: ["simulation"],
          createdAt: new Date().toISOString(),
        },
      }),
    ).toThrow();
  });
});
