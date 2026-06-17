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

export type ApprovalStatus = "pending" | "approved" | "executed" | "rejected" | "expired";

export interface ExecutionPayload {
  intent: {
    agent: string;
    target: string;
    data: string;
    value: string;
    nonce: string;
  };
  covenantHash: string;
  attestation?: {
    deadline: string;
    v: number;
    r: string;
    s: string;
  };
  preflightRequest?: Record<string, unknown>;
}

export interface ApprovalRequest {
  id: string;
  sessionId: string;
  walletAddress: `0x${string}`;
  intentHash: string;
  verdict: string;
  preflightSummary: Record<string, unknown>;
  executionPayload?: ExecutionPayload;
  status: ApprovalStatus;
  approvalUrl: string;
  txHash?: string;
  decisionId?: string;
  expiresAt: number;
  createdAt: number;
}

export interface SiweChallenge {
  nonce: string;
  message: string;
  connectUrl: string;
  expiresAt: number;
}
