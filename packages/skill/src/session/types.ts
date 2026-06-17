export type SessionPermission = "reputation" | "simulate" | "preflight" | "execute";

export interface CovenantSession {
  id: string;
  walletAddress: `0x${string}`;
  agentAddress?: `0x${string}`;
  permissions: SessionPermission[];
  maxSpendWei?: string;
  expiresAt: number;
  createdAt: number;
  revoked: boolean;
}

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export interface ApprovalRequest {
  id: string;
  sessionId: string;
  walletAddress: `0x${string}`;
  intentHash: string;
  verdict: string;
  preflightSummary: Record<string, unknown>;
  status: ApprovalStatus;
  approvalUrl: string;
  expiresAt: number;
  createdAt: number;
}

export interface SiweChallenge {
  nonce: string;
  message: string;
  connectUrl: string;
  expiresAt: number;
}
