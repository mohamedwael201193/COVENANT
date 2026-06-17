import { randomBytes } from "node:crypto";
import type { ApprovalRequest, CovenantSession, SiweChallenge } from "./types.js";

const sessions = new Map<string, CovenantSession>();
const approvals = new Map<string, ApprovalRequest>();
const siweNonces = new Map<string, { nonce: string; expiresAt: number }>();

function id(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

export function getDashboardBase(): string {
  return (
    process.env.COVENANT_DASHBOARD_URL?.replace(/\/$/, "") ??
    "https://covenant-web-mu.vercel.app"
  );
}

export function createSiweChallenge(walletAddress: `0x${string}`): SiweChallenge {
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000;
  siweNonces.set(walletAddress.toLowerCase(), { nonce, expiresAt });

  const domain = "covenant.pharos";
  const uri = getDashboardBase();
  const issuedAt = new Date().toISOString();
  const message = `${domain} wants you to sign in with your Ethereum account:
${walletAddress}

Sign in to COVENANT agent session. No transaction will be sent.

URI: ${uri}
Version: 1
Chain ID: 688689
Nonce: ${nonce}
Issued At: ${issuedAt}`;

  return {
    nonce,
    message,
    connectUrl: `${uri}/connect?address=${walletAddress}&nonce=${nonce}`,
    expiresAt,
  };
}

export function verifySiweNonce(walletAddress: string, nonce: string): boolean {
  const entry = siweNonces.get(walletAddress.toLowerCase());
  if (!entry || entry.nonce !== nonce || entry.expiresAt < Date.now()) {
    return false;
  }
  siweNonces.delete(walletAddress.toLowerCase());
  return true;
}

export function createSession(input: {
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

export function getSession(sessionId: string): CovenantSession | undefined {
  const s = sessions.get(sessionId);
  if (!s || s.revoked || s.expiresAt < Date.now()) {
    return undefined;
  }
  return s;
}

export function revokeSession(sessionId: string): boolean {
  const s = sessions.get(sessionId);
  if (!s) return false;
  s.revoked = true;
  return true;
}

export function createApproval(input: {
  sessionId: string;
  walletAddress: `0x${string}`;
  intentHash: string;
  verdict: string;
  preflightSummary: Record<string, unknown>;
}): ApprovalRequest {
  const approvalId = id("appr");
  const approval: ApprovalRequest = {
    id: approvalId,
    sessionId: input.sessionId,
    walletAddress: input.walletAddress,
    intentHash: input.intentHash,
    verdict: input.verdict,
    preflightSummary: input.preflightSummary,
    status: "pending",
    approvalUrl: `${getDashboardBase()}/approve/${approvalId}`,
    expiresAt: Date.now() + 30 * 60 * 1000,
    createdAt: Date.now(),
  };
  approvals.set(approvalId, approval);
  return approval;
}

export function getApproval(id: string): ApprovalRequest | undefined {
  const a = approvals.get(id);
  if (!a) return undefined;
  if (a.status === "pending" && a.expiresAt < Date.now()) {
    a.status = "expired";
  }
  return a;
}

export function listPendingApprovals(sessionId: string): ApprovalRequest[] {
  return [...approvals.values()].filter(
    (a) => a.sessionId === sessionId && a.status === "pending" && a.expiresAt >= Date.now(),
  );
}

export function updateApprovalStatus(
  id: string,
  status: ApprovalRequest["status"],
): ApprovalRequest | undefined {
  const a = approvals.get(id);
  if (!a) return undefined;
  a.status = status;
  return a;
}

/** Test helper */
export function clearSessionStore(): void {
  sessions.clear();
  approvals.clear();
  siweNonces.clear();
}
