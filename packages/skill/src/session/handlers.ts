import { z } from "zod";
import { verifyMessage } from "viem";
import {
  createApproval,
  createSession,
  createSiweChallenge,
  getApproval,
  getSession,
  getSiweChallenge,
  listPendingApprovals,
  revokeSession,
  updateApprovalStatus,
  verifySiweNonce,
} from "./store.js";
import { sessionApiBase, remoteConnectWallet, remoteCreateSession, remoteGetPendingApprovals, remoteRequestApproval, remoteExecuteAuthorized, remoteRevokeSession } from "./remote.js";
import { preflightRequestSchema } from "../engine/schema.js";
import type { SessionPermission } from "./types.js";

const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const hexData = z.string().regex(/^0x([a-fA-F0-9]*|)$/);

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
    .default(["reputation", "simulate", "preflight", "execute"]),
  maxSpendWei: z.string().optional(),
  durationDays: z.number().int().min(1).max(90).default(7),
});

export const sessionIdSchema = z.object({
  sessionId: z.string().min(8),
});

const executionPayloadSchema = z.object({
  intent: z.object({
    agent: address,
    target: address,
    data: hexData,
    value: z.string(),
    nonce: z.string(),
  }),
  covenantHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  attestation: z
    .object({
      deadline: z.string(),
      v: z.number().int(),
      r: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
      s: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    })
    .optional(),
  preflightRequest: z.record(z.unknown()).optional(),
});

export const requestApprovalSchema = z.object({
  sessionId: z.string().min(8),
  intentHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  verdict: z.enum(["ALLOW", "WARN", "DENY"]),
  preflightSummary: z.record(z.unknown()).optional(),
  executionPayload: executionPayloadSchema.optional(),
});

export const completeApprovalSchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  decisionId: z.string().optional(),
});

export async function handleConnectWallet(args: unknown) {
  if (sessionApiBase()) return remoteConnectWallet(args);
  const input = connectWalletSchema.parse(args);
  const challenge = await createSiweChallenge(input.walletAddress as `0x${string}`);
  return {
    ...challenge,
    instructions: "Open connectUrl in browser to sign SIWE and create a session.",
  };
}

export async function handleGetSiweChallenge(walletAddress: string, nonce: string) {
  const challenge = await getSiweChallenge(walletAddress, nonce);
  if (!challenge) {
    throw new Error("Challenge not found or expired. Call covenant_connect_wallet again.");
  }
  return { walletAddress, nonce, message: challenge.message, expiresAt: challenge.expiresAt };
}

export async function handleCreateSession(args: unknown) {
  if (sessionApiBase()) return remoteCreateSession(args);
  const input = createSessionSchema.parse(args);
  if (!(await verifySiweNonce(input.walletAddress, input.nonce))) {
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
    throw new Error("Invalid SIWE signature.");
  }
  const session = await createSession({
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
    successUrl: `${process.env.COVENANT_DASHBOARD_URL?.replace(/\/$/, "") ?? "https://covenant-skill.vercel.app"}/connect/success?sessionId=${session.id}`,
  };
}

export async function handleRevokeSession(args: unknown) {
  if (sessionApiBase()) {
    const input = sessionIdSchema.parse(args);
    return remoteRevokeSession(input.sessionId);
  }
  const input = sessionIdSchema.parse(args);
  if (!(await revokeSession(input.sessionId))) {
    throw new Error("Session not found");
  }
  return { revoked: true, sessionId: input.sessionId };
}

export async function handleRequestApproval(args: unknown) {
  if (sessionApiBase()) return remoteRequestApproval(args);
  const input = requestApprovalSchema.parse(args);
  const session = await getSession(input.sessionId);
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
  const approval = await createApproval({
    sessionId: session.id,
    walletAddress: session.walletAddress,
    intentHash: input.intentHash,
    verdict: input.verdict,
    preflightSummary: input.preflightSummary ?? {},
    executionPayload: input.executionPayload as Record<string, unknown> | undefined,
  });
  return {
    approvalId: approval.id,
    status: approval.status,
    approvalUrl: approval.approvalUrl,
    expiresAt: new Date(approval.expiresAt).toISOString(),
    instructions: "User opens approvalUrl to review and execute with wallet.",
  };
}

export async function handleGetPendingApprovals(args: unknown) {
  if (sessionApiBase()) {
    const input = sessionIdSchema.parse(args);
    return remoteGetPendingApprovals(input.sessionId);
  }
  const input = sessionIdSchema.parse(args);
  const session = await getSession(input.sessionId);
  if (!session) {
    throw new Error("Invalid or expired session");
  }
  return { approvals: await listPendingApprovals(input.sessionId) };
}

export async function handleExecuteAuthorized(args: unknown) {
  if (sessionApiBase()) {
    const input = z.object({ approvalId: z.string().min(8) }).parse(args);
    return remoteExecuteAuthorized(input.approvalId);
  }
  const input = z.object({ approvalId: z.string().min(8) }).parse(args);
  const approval = await getApproval(input.approvalId);
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
  if (approval.status === "executed") {
    return {
      status: "executed",
      txHash: approval.txHash,
      decisionId: approval.decisionId,
      intentHash: approval.intentHash,
    };
  }
  if (approval.status !== "approved") {
    throw new Error(`Approval status: ${approval.status}`);
  }
  return {
    status: approval.status,
    intentHash: approval.intentHash,
    preflightSummary: approval.preflightSummary,
  };
}

export async function handleCompleteApproval(approvalId: string, args: unknown) {
  const input = completeApprovalSchema.parse(args);
  const approval = await getApproval(approvalId);
  if (!approval) {
    throw new Error("Approval not found");
  }
  const updated = await updateApprovalStatus(approvalId, "executed", {
    txHash: input.txHash,
    decisionId: input.decisionId,
  });
  return updated;
}

export async function handlePrepareApprovalExecution(
  approvalId: string,
  services: import("../engine/preflightEvaluate.js").PreflightServices,
) {
  const approval = await getApproval(approvalId);
  if (!approval) throw new Error("Approval not found");
  if (approval.status === "expired") throw new Error("Approval expired");
  let payload = approval.executionPayload;
  if (!payload?.attestation && payload?.preflightRequest) {
    const { runPreflight } = await import("../engine/preflight.js");
    const parsed = preflightRequestSchema.parse(payload.preflightRequest);
    const result = await runPreflight(services, parsed, { skipGoPlusIfUnavailable: true, skipLlm: true });
    if (!result.attestation) throw new Error("Could not obtain attestation for execution");
    payload = {
      ...payload,
      covenantHash: payload.covenantHash,
      attestation: {
        deadline: result.attestation.deadline.toString(),
        v: result.attestation.v,
        r: result.attestation.r,
        s: result.attestation.s,
      },
    };
  }
  if (!payload?.intent || !payload.covenantHash || !payload.attestation) {
    throw new Error("Approval missing execution payload. Agent must pass executionPayload in covenant_request_approval.");
  }
  return { approval, execution: payload };
}

export { getApproval, updateApprovalStatus } from "./store.js";
