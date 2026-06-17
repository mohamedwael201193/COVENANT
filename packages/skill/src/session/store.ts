import type { ApprovalRequest, CovenantSession, SiweChallenge } from "./types.js";
import * as memory from "./memoryStore.js";
import * as pg from "./pgStore.js";

function usePostgres(): boolean {
  if (process.env.COVENANT_SESSION_STORE === "memory" || process.env.NODE_ENV === "test") {
    return false;
  }
  return Boolean(process.env.DATABASE_URL);
}

function requirePersistentStore(): never {
  throw new Error(
    "Persistent session store required. Set DATABASE_URL, or set COVENANT_SESSION_STORE=memory only for tests.",
  );
}

export { getDashboardBase } from "./siwe.js";

export async function createSiweChallenge(walletAddress: `0x${string}`): Promise<SiweChallenge> {
  if (usePostgres()) return pg.createSiweChallengePg(walletAddress);
  if (process.env.COVENANT_SESSION_STORE === "memory" || process.env.NODE_ENV === "test") {
    return memory.createSiweChallengeMemory(walletAddress);
  }
  return requirePersistentStore();
}

export async function getSiweChallenge(
  walletAddress: string,
  nonce: string,
): Promise<{ message: string; expiresAt: number } | undefined> {
  if (usePostgres()) return pg.getSiweChallengePg(walletAddress, nonce);
  if (process.env.COVENANT_SESSION_STORE === "memory" || process.env.NODE_ENV === "test") {
    return memory.getSiweChallengeMemory(walletAddress, nonce);
  }
  return requirePersistentStore();
}

export async function verifySiweNonce(walletAddress: string, nonce: string): Promise<boolean> {
  if (usePostgres()) return pg.verifySiweNoncePg(walletAddress, nonce);
  if (process.env.COVENANT_SESSION_STORE === "memory" || process.env.NODE_ENV === "test") {
    return memory.verifySiweNonceMemory(walletAddress, nonce);
  }
  return requirePersistentStore();
}

export async function createSession(input: {
  walletAddress: `0x${string}`;
  agentAddress?: `0x${string}`;
  permissions: CovenantSession["permissions"];
  maxSpendWei?: string;
  durationDays: number;
}): Promise<CovenantSession> {
  if (usePostgres()) return pg.createSessionPg(input);
  if (process.env.COVENANT_SESSION_STORE === "memory" || process.env.NODE_ENV === "test") {
    return memory.createSessionMemory(input);
  }
  return requirePersistentStore();
}

export async function getSession(sessionId: string): Promise<CovenantSession | undefined> {
  if (usePostgres()) return pg.getSessionPg(sessionId);
  if (process.env.COVENANT_SESSION_STORE === "memory" || process.env.NODE_ENV === "test") {
    return memory.getSessionMemory(sessionId);
  }
  return requirePersistentStore();
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  if (usePostgres()) return pg.revokeSessionPg(sessionId);
  if (process.env.COVENANT_SESSION_STORE === "memory" || process.env.NODE_ENV === "test") {
    return memory.revokeSessionMemory(sessionId);
  }
  return requirePersistentStore();
}

export async function createApproval(input: {
  sessionId: string;
  walletAddress: `0x${string}`;
  intentHash: string;
  verdict: string;
  preflightSummary: Record<string, unknown>;
  executionPayload?: Record<string, unknown>;
}): Promise<ApprovalRequest> {
  if (usePostgres()) return pg.createApprovalPg(input);
  if (process.env.COVENANT_SESSION_STORE === "memory" || process.env.NODE_ENV === "test") {
    return memory.createApprovalMemory(input);
  }
  return requirePersistentStore();
}

export async function getApproval(id: string): Promise<ApprovalRequest | undefined> {
  if (usePostgres()) return pg.getApprovalPg(id);
  if (process.env.COVENANT_SESSION_STORE === "memory" || process.env.NODE_ENV === "test") {
    return memory.getApprovalMemory(id);
  }
  return requirePersistentStore();
}

export async function listPendingApprovals(sessionId: string): Promise<ApprovalRequest[]> {
  if (usePostgres()) return pg.listPendingApprovalsPg(sessionId);
  if (process.env.COVENANT_SESSION_STORE === "memory" || process.env.NODE_ENV === "test") {
    return memory.listPendingApprovalsMemory(sessionId);
  }
  return requirePersistentStore();
}

export async function updateApprovalStatus(
  id: string,
  status: ApprovalRequest["status"],
  extra?: { txHash?: string; decisionId?: string },
): Promise<ApprovalRequest | undefined> {
  if (usePostgres()) return pg.updateApprovalPg(id, { status, ...extra });
  if (process.env.COVENANT_SESSION_STORE === "memory" || process.env.NODE_ENV === "test") {
    return memory.updateApprovalMemory(id, { status, ...extra });
  }
  return requirePersistentStore();
}

/** Test helper */
export function clearSessionStore(): void {
  memory.clearSessionStoreMemory();
}
