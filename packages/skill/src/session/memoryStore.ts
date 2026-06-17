import { randomBytes } from "node:crypto";
import type { ApprovalRequest, CovenantSession, SiweChallenge } from "./types.js";
import { buildSiweMessage, getDashboardBase } from "./siwe.js";

const sessions = new Map<string, CovenantSession>();
const approvals = new Map<string, ApprovalRequest>();
const siweNonces = new Map<string, { nonce: string; message: string; expiresAt: number }>();

function id(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

export function createSiweChallengeMemory(walletAddress: `0x${string}`): SiweChallenge {
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const message = buildSiweMessage(walletAddress, nonce);
  siweNonces.set(walletAddress.toLowerCase(), { nonce, message, expiresAt });
  return {
    nonce,
    message,
    connectUrl: `${getDashboardBase()}/connect?address=${walletAddress}&nonce=${nonce}`,
    expiresAt,
  };
}

export function getSiweChallengeMemory(
  walletAddress: string,
  nonce: string,
): { message: string; expiresAt: number } | undefined {
  const entry = siweNonces.get(walletAddress.toLowerCase());
  if (!entry || entry.nonce !== nonce || entry.expiresAt < Date.now()) {
    return undefined;
  }
  return { message: entry.message, expiresAt: entry.expiresAt };
}

export function verifySiweNonceMemory(walletAddress: string, nonce: string): boolean {
  const entry = siweNonces.get(walletAddress.toLowerCase());
  if (!entry || entry.nonce !== nonce || entry.expiresAt < Date.now()) {
    return false;
  }
  siweNonces.delete(walletAddress.toLowerCase());
  return true;
}

export function createSessionMemory(input: {
  walletAddress: `0x${string}`;
  agentAddress?: `0x${string}`;
  permissions: CovenantSession["permissions"];
  maxSpendWei?: string;
  durationDays: number;
}): CovenantSession {
  const session: CovenantSession = {
    id: id("sess"),
    walletAddress: input.walletAddress,
    agentAddress: input.agentAddress,
    permissions: input.permissions,
    maxSpendWei: input.maxSpendWei,
    expiresAt: Date.now() + input.durationDays * 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
    revoked: false,
  };
  sessions.set(session.id, session);
  return session;
}

export function getSessionMemory(sessionId: string): CovenantSession | undefined {
  const s = sessions.get(sessionId);
  if (!s || s.revoked || s.expiresAt < Date.now()) {
    return undefined;
  }
  return s;
}

export function revokeSessionMemory(sessionId: string): boolean {
  const s = sessions.get(sessionId);
  if (!s) return false;
  s.revoked = true;
  return true;
}

export function createApprovalMemory(input: {
  sessionId: string;
  walletAddress: `0x${string}`;
  intentHash: string;
  verdict: string;
  preflightSummary: Record<string, unknown>;
  executionPayload?: Record<string, unknown>;
}): ApprovalRequest {
  const approvalId = id("appr");
  const approval: ApprovalRequest = {
    id: approvalId,
    sessionId: input.sessionId,
    walletAddress: input.walletAddress,
    intentHash: input.intentHash,
    verdict: input.verdict,
    preflightSummary: input.preflightSummary,
    executionPayload: input.executionPayload as ApprovalRequest["executionPayload"],
    status: "pending",
    approvalUrl: `${getDashboardBase()}/approve/${approvalId}`,
    expiresAt: Date.now() + 30 * 60 * 1000,
    createdAt: Date.now(),
  };
  approvals.set(approvalId, approval);
  return approval;
}

export function getApprovalMemory(id: string): ApprovalRequest | undefined {
  const a = approvals.get(id);
  if (!a) return undefined;
  if (a.status === "pending" && a.expiresAt < Date.now()) {
    a.status = "expired";
  }
  return a;
}

export function listPendingApprovalsMemory(sessionId: string): ApprovalRequest[] {
  return [...approvals.values()].filter(
    (a) => a.sessionId === sessionId && a.status === "pending" && a.expiresAt >= Date.now(),
  );
}

export function updateApprovalMemory(
  id: string,
  patch: Partial<Pick<ApprovalRequest, "status" | "txHash" | "decisionId">>,
): ApprovalRequest | undefined {
  const a = approvals.get(id);
  if (!a) return undefined;
  Object.assign(a, patch);
  return a;
}

export function clearSessionStoreMemory(): void {
  sessions.clear();
  approvals.clear();
  siweNonces.clear();
}
