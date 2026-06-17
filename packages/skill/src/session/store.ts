import type { ApprovalRequest, CovenantSession, SiweChallenge } from "./types.js";
import * as memory from "./memoryStore.js";
import * as pg from "./pgStore.js";

function usePostgres(): boolean {
  if (process.env.COVENANT_SESSION_STORE === "memory") return false;
  return Boolean(process.env.DATABASE_URL);
}

export { getDashboardBase } from "./siwe.js";

export async function createSiweChallenge(walletAddress: `0x${string}`): Promise<SiweChallenge> {
  return usePostgres()
    ? pg.createSiweChallengePg(walletAddress)
    : memory.createSiweChallengeMemory(walletAddress);
}

export async function getSiweChallenge(
  walletAddress: string,
  nonce: string,
): Promise<{ message: string; expiresAt: number } | undefined> {
  return usePostgres()
    ? pg.getSiweChallengePg(walletAddress, nonce)
    : memory.getSiweChallengeMemory(walletAddress, nonce);
}

export async function verifySiweNonce(walletAddress: string, nonce: string): Promise<boolean> {
  return usePostgres()
    ? pg.verifySiweNoncePg(walletAddress, nonce)
    : memory.verifySiweNonceMemory(walletAddress, nonce);
}

export async function createSession(input: {
  walletAddress: `0x${string}`;
  agentAddress?: `0x${string}`;
  permissions: CovenantSession["permissions"];
  maxSpendWei?: string;
  durationDays: number;
}): Promise<CovenantSession> {
  return usePostgres() ? pg.createSessionPg(input) : memory.createSessionMemory(input);
}

export async function getSession(sessionId: string): Promise<CovenantSession | undefined> {
  return usePostgres() ? pg.getSessionPg(sessionId) : memory.getSessionMemory(sessionId);
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  return usePostgres() ? pg.revokeSessionPg(sessionId) : memory.revokeSessionMemory(sessionId);
}

export async function createApproval(input: {
  sessionId: string;
  walletAddress: `0x${string}`;
  intentHash: string;
  verdict: string;
  preflightSummary: Record<string, unknown>;
  executionPayload?: Record<string, unknown>;
}): Promise<ApprovalRequest> {
  return usePostgres() ? pg.createApprovalPg(input) : memory.createApprovalMemory(input);
}

export async function getApproval(id: string): Promise<ApprovalRequest | undefined> {
  return usePostgres() ? pg.getApprovalPg(id) : memory.getApprovalMemory(id);
}

export async function listPendingApprovals(sessionId: string): Promise<ApprovalRequest[]> {
  return usePostgres()
    ? pg.listPendingApprovalsPg(sessionId)
    : memory.listPendingApprovalsMemory(sessionId);
}

export async function updateApprovalStatus(
  id: string,
  status: ApprovalRequest["status"],
  extra?: { txHash?: string; decisionId?: string },
): Promise<ApprovalRequest | undefined> {
  return usePostgres()
    ? pg.updateApprovalPg(id, { status, ...extra })
    : memory.updateApprovalMemory(id, { status, ...extra });
}

/** Test helper */
export function clearSessionStore(): void {
  memory.clearSessionStoreMemory();
}
