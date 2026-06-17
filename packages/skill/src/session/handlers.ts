import { z } from "zod";
import { verifyMessage } from "viem";
import {
  createApproval,
  createSession,
  createSiweChallenge,
  getApproval,
  getSession,
  listPendingApprovals,
  revokeSession,
  verifySiweNonce,
} from "./store.js";
import type { SessionPermission } from "./types.js";

const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

export const connectWalletSchema = z.object({
  walletAddress: address,
});

export const createSessionSchema = z.object({
  walletAddress: address,
  agentAddress: address.optional(),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
  message: z.string().min(10),
  nonce: z.string().min(8),
  permissions: z
    .array(z.enum(["reputation", "simulate", "preflight", "execute"]))
    .default(["reputation", "simulate", "preflight"]),
  maxSpendWei: z.string().optional(),
  durationDays: z.number().int().min(1).max(90).default(7),
});

export const sessionIdSchema = z.object({
  sessionId: z.string().min(8),
});

export const requestApprovalSchema = z.object({
  sessionId: z.string().min(8),
  intentHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  verdict: z.enum(["ALLOW", "WARN", "DENY"]),
  preflightSummary: z.record(z.unknown()).optional(),
});

export async function handleConnectWallet(args: unknown) {
  const input = connectWalletSchema.parse(args);
  const challenge = createSiweChallenge(input.walletAddress as `0x${string}`);
  return {
    ...challenge,
    instructions:
      "User signs `message` in their wallet (SIWE). Then call covenant_create_session with signature + nonce. Or open connectUrl in browser.",
  };
}

export async function handleCreateSession(args: unknown) {
  const input = createSessionSchema.parse(args);
  if (!verifySiweNonce(input.walletAddress, input.nonce)) {
    throw new Error("Invalid or expired SIWE nonce. Call covenant_connect_wallet first.");
  }
  if (!input.message.includes(input.nonce)) {
    throw new Error("SIWE message must include the issued nonce.");
  }
  const valid = await verifyMessage({
    address: input.walletAddress as `0x${string}`,
    message: input.message,
    signature: input.signature as `0x${string}`,
  });
  if (!valid) {
    throw new Error("Invalid SIWE signature. User must sign the exact message from covenant_connect_wallet.");
  }
  const session = createSession({
    walletAddress: input.walletAddress as `0x${string}`,
    agentAddress: input.agentAddress as `0x${string}` | undefined,
    permissions: input.permissions as SessionPermission[],
    maxSpendWei: input.maxSpendWei,
    durationDays: input.durationDays,
  });
  return {
    sessionId: session.id,
    walletAddress: session.walletAddress,
    permissions: session.permissions,
    expiresAt: new Date(session.expiresAt).toISOString(),
    maxSpendWei: session.maxSpendWei,
  };
}

export async function handleRevokeSession(args: unknown) {
  const input = sessionIdSchema.parse(args);
  if (!revokeSession(input.sessionId)) {
    throw new Error("Session not found");
  }
  return { revoked: true, sessionId: input.sessionId };
}

export async function handleRequestApproval(args: unknown) {
  const input = requestApprovalSchema.parse(args);
  const session = getSession(input.sessionId);
  if (!session) {
    throw new Error("Invalid or expired session");
  }
  if (!session.permissions.includes("execute") && input.verdict === "ALLOW") {
    throw new Error("Session lacks execute permission");
  }
  if (input.verdict === "DENY") {
    return {
      status: "rejected",
      message: "Preflight DENY — no approval needed",
      intentHash: input.intentHash,
    };
  }
  const approval = createApproval({
    sessionId: session.id,
    walletAddress: session.walletAddress,
    intentHash: input.intentHash,
    verdict: input.verdict,
    preflightSummary: input.preflightSummary ?? {},
  });
  return {
    approvalId: approval.id,
    status: approval.status,
    approvalUrl: approval.approvalUrl,
    expiresAt: new Date(approval.expiresAt).toISOString(),
    instructions:
      "User opens approvalUrl, connects wallet, and signs the GuardedExecutor transaction. No private keys in agent.",
  };
}

export async function handleGetPendingApprovals(args: unknown) {
  const input = sessionIdSchema.parse(args);
  const session = getSession(input.sessionId);
  if (!session) {
    throw new Error("Invalid or expired session");
  }
  return { approvals: listPendingApprovals(input.sessionId) };
}

export async function handleExecuteAuthorized(args: unknown) {
  const input = z
    .object({
      approvalId: z.string().min(8),
    })
    .parse(args);
  const approval = getApproval(input.approvalId);
  if (!approval) {
    throw new Error("Approval not found");
  }
  if (approval.status === "pending") {
    return {
      status: "pending",
      approvalUrl: approval.approvalUrl,
      message: "Waiting for user wallet signature at approvalUrl",
    };
  }
  if (approval.status !== "approved") {
    throw new Error(`Approval status: ${approval.status}`);
  }
  return {
    status: "approved",
    intentHash: approval.intentHash,
    message: "User approved. Submit GuardedExecutor.execute with attestation from covenant_sign_attestation.",
    preflightSummary: approval.preflightSummary,
  };
}

export { getApproval, updateApprovalStatus } from "./store.js";
