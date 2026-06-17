import pg from "pg";
import { randomBytes } from "node:crypto";
import type { ApprovalRequest, CovenantSession, SessionPermission, SiweChallenge } from "./types.js";
import { buildSiweMessage, getDashboardBase } from "./siwe.js";
import { buildPgPoolConfig } from "./pgConfig.js";

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL required for Postgres session store");
    pool = new pg.Pool(buildPgPoolConfig(url));
  }
  return pool;
}

function id(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

function rowToSession(row: Record<string, unknown>): CovenantSession {
  return {
    id: row.id as string,
    walletAddress: row.wallet_address as `0x${string}`,
    agentAddress: (row.agent_address as `0x${string}` | null) ?? undefined,
    permissions: row.permissions as SessionPermission[],
    maxSpendWei: (row.max_spend_wei as string | null) ?? undefined,
    expiresAt: new Date(row.expires_at as string).getTime(),
    createdAt: new Date(row.created_at as string).getTime(),
    revoked: Boolean(row.revoked),
  };
}

function rowToApproval(row: Record<string, unknown>): ApprovalRequest {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    walletAddress: row.wallet_address as `0x${string}`,
    intentHash: row.intent_hash as string,
    verdict: row.verdict as string,
    preflightSummary: row.preflight_summary as Record<string, unknown>,
    executionPayload: (row.execution_payload as ApprovalRequest["executionPayload"] | null) ?? undefined,
    status: row.status as ApprovalRequest["status"],
    approvalUrl: `${getDashboardBase()}/approve/${row.id as string}`,
    txHash: (row.tx_hash as string | null) ?? undefined,
    decisionId: (row.decision_id as string | null) ?? undefined,
    expiresAt: new Date(row.expires_at as string).getTime(),
    createdAt: new Date(row.created_at as string).getTime(),
  };
}

export async function createSiweChallengePg(walletAddress: `0x${string}`): Promise<SiweChallenge> {
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const message = buildSiweMessage(walletAddress, nonce);
  await getPool().query(
    `INSERT INTO siwe_nonces (wallet_address, nonce, message, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (wallet_address) DO UPDATE SET nonce = $2, message = $3, expires_at = $4`,
    [walletAddress.toLowerCase(), nonce, message, expiresAt.toISOString()],
  );
  return {
    nonce,
    message,
    connectUrl: `${getDashboardBase()}/connect?address=${walletAddress}&nonce=${nonce}`,
    expiresAt: expiresAt.getTime(),
  };
}

export async function getSiweChallengePg(
  walletAddress: string,
  nonce: string,
): Promise<{ message: string; expiresAt: number } | undefined> {
  const res = await getPool().query(
    `SELECT message, expires_at FROM siwe_nonces WHERE wallet_address = $1 AND nonce = $2`,
    [walletAddress.toLowerCase(), nonce],
  );
  const row = res.rows[0];
  if (!row) return undefined;
  const expiresAt = new Date(row.expires_at as string).getTime();
  if (expiresAt < Date.now()) return undefined;
  return { message: row.message as string, expiresAt };
}

export async function verifySiweNoncePg(walletAddress: string, nonce: string): Promise<boolean> {
  const res = await getPool().query(
    `DELETE FROM siwe_nonces WHERE wallet_address = $1 AND nonce = $2 AND expires_at > NOW() RETURNING nonce`,
    [walletAddress.toLowerCase(), nonce],
  );
  return res.rowCount !== null && res.rowCount > 0;
}

export async function createSessionPg(input: {
  walletAddress: `0x${string}`;
  agentAddress?: `0x${string}`;
  permissions: CovenantSession["permissions"];
  maxSpendWei?: string;
  durationDays: number;
}): Promise<CovenantSession> {
  const sessionId = id("sess");
  const expiresAt = new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000);
  await getPool().query(
    `INSERT INTO agent_sessions (id, wallet_address, agent_address, permissions, max_spend_wei, expires_at, revoked)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6, false)`,
    [
      sessionId,
      input.walletAddress.toLowerCase(),
      input.agentAddress?.toLowerCase() ?? null,
      JSON.stringify(input.permissions),
      input.maxSpendWei ?? null,
      expiresAt.toISOString(),
    ],
  );
  return {
    id: sessionId,
    walletAddress: input.walletAddress,
    agentAddress: input.agentAddress,
    permissions: input.permissions,
    maxSpendWei: input.maxSpendWei,
    expiresAt: expiresAt.getTime(),
    createdAt: Date.now(),
    revoked: false,
  };
}

export async function getSessionPg(sessionId: string): Promise<CovenantSession | undefined> {
  const res = await getPool().query(
    `SELECT * FROM agent_sessions WHERE id = $1 AND revoked = false AND expires_at > NOW()`,
    [sessionId],
  );
  const row = res.rows[0];
  return row ? rowToSession(row) : undefined;
}

export async function revokeSessionPg(sessionId: string): Promise<boolean> {
  const res = await getPool().query(`UPDATE agent_sessions SET revoked = true WHERE id = $1`, [sessionId]);
  return (res.rowCount ?? 0) > 0;
}

export async function createApprovalPg(input: {
  sessionId: string;
  walletAddress: `0x${string}`;
  intentHash: string;
  verdict: string;
  preflightSummary: Record<string, unknown>;
  executionPayload?: Record<string, unknown>;
}): Promise<ApprovalRequest> {
  const approvalId = id("appr");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await getPool().query(
    `INSERT INTO approval_requests
     (id, session_id, wallet_address, intent_hash, verdict, preflight_summary, execution_payload, status, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, 'pending', $8)`,
    [
      approvalId,
      input.sessionId,
      input.walletAddress.toLowerCase(),
      input.intentHash,
      input.verdict,
      JSON.stringify(input.preflightSummary),
      input.executionPayload ? JSON.stringify(input.executionPayload) : null,
      expiresAt.toISOString(),
    ],
  );
  return {
    id: approvalId,
    sessionId: input.sessionId,
    walletAddress: input.walletAddress,
    intentHash: input.intentHash,
    verdict: input.verdict,
    preflightSummary: input.preflightSummary,
    executionPayload: input.executionPayload as ApprovalRequest["executionPayload"],
    status: "pending",
    approvalUrl: `${getDashboardBase()}/approve/${approvalId}`,
    expiresAt: expiresAt.getTime(),
    createdAt: Date.now(),
  };
}

export async function getApprovalPg(id: string): Promise<ApprovalRequest | undefined> {
  const res = await getPool().query(`SELECT * FROM approval_requests WHERE id = $1`, [id]);
  const row = res.rows[0];
  if (!row) return undefined;
  const approval = rowToApproval(row);
  if (approval.status === "pending" && approval.expiresAt < Date.now()) {
    await getPool().query(`UPDATE approval_requests SET status = 'expired' WHERE id = $1`, [id]);
    approval.status = "expired";
  }
  return approval;
}

export async function listPendingApprovalsPg(sessionId: string): Promise<ApprovalRequest[]> {
  const res = await getPool().query(
    `SELECT * FROM approval_requests WHERE session_id = $1 AND status = 'pending' AND expires_at > NOW()`,
    [sessionId],
  );
  return res.rows.map(rowToApproval);
}

export async function updateApprovalPg(
  id: string,
  patch: Partial<Pick<ApprovalRequest, "status" | "txHash" | "decisionId">>,
): Promise<ApprovalRequest | undefined> {
  const sets: string[] = [];
  const vals: unknown[] = [id];
  let i = 2;
  if (patch.status) {
    sets.push(`status = $${i++}`);
    vals.push(patch.status);
  }
  if (patch.txHash) {
    sets.push(`tx_hash = $${i++}`);
    vals.push(patch.txHash);
  }
  if (patch.decisionId) {
    sets.push(`decision_id = $${i++}`);
    vals.push(patch.decisionId);
  }
  if (sets.length === 0) return getApprovalPg(id);
  await getPool().query(`UPDATE approval_requests SET ${sets.join(", ")} WHERE id = $1`, vals);
  return getApprovalPg(id);
}

export async function disconnectPgPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
