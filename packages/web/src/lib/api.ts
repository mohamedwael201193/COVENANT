const HEALTH_BASE = import.meta.env.VITE_HEALTH_URL ?? "";
const API_BASE =
  import.meta.env.VITE_API_URL ?? (HEALTH_BASE ? `${HEALTH_BASE.replace(/\/$/, "")}/api` : "/api");

export const apiConfig = { apiBase: API_BASE, healthBase: HEALTH_BASE || undefined };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      typeof body.error === "string"
        ? body.error
        : body.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  rpc?: {
    chainId: number;
    blockNumber: string;
    ethCall: boolean;
    estimateGas: boolean;
    debugTraceCall: boolean;
  };
  attester?: {
    address: string;
    onChain: string;
    match: boolean;
    balanceWei: string;
  };
  message?: string;
}

export interface AgentRecord {
  agent: string;
  owner: string;
  metadataURI: string;
  active: boolean;
  blockNumber: string;
}

export interface CovenantRecord {
  owner: string;
  agent: string;
  covenantHash: string;
  tierCurveRef: string;
  ipfsURI: string;
  updatedAt: string;
}

export interface DecisionRecord {
  id: string;
  agent: string;
  intentHash: string;
  verdict: string;
  verdictCode: number;
  reasonHash: string;
  outcomeHash: string;
  timestamp: string;
}

export interface DecisionStats {
  total: number;
  allow: number;
  warn: number;
  deny: number;
}

export interface ReputationRecord extends AgentRecord {
  score: string;
  tier: number;
  updatedAt: string;
}

export interface SetCovenantPayload {
  agent: string;
  ownerPrivateKey: string;
  ipfsURI: string;
  covenant: {
    version: "1";
    agent: string;
    owner: string;
    allowlist: string[];
    denylist: string[];
    baseMaxValueWei: string;
    tierLimits: Array<{ tier: number; maxValueWei: string }>;
    minCounterpartyTier: number;
    timeWindows: Array<{ startHourUtc: number; endHourUtc: number }>;
    requiredChecks: ("simulation" | "goplus")[];
    label?: string;
    createdAt: string;
  };
}

export interface SetCovenantResponse {
  txHash: string;
  covenantHash: string;
  tierCurveRef: string;
  ipfsURI: string;
}

export interface DecisionEvent {
  id: string;
  agent: string;
  verdict: string;
  intentHash: string;
  timestamp: string;
}

export const api = {
  getHealth: () =>
    fetch(HEALTH_BASE ? `${HEALTH_BASE}/health` : "/health").then((r) => r.json()) as Promise<HealthResponse>,

  getAgents: () => request<{ agents: AgentRecord[] }>("/agents"),

  getCovenants: () => request<{ covenants: CovenantRecord[] }>("/covenants"),

  getDecisions: (limit = 50) =>
    request<{ decisions: DecisionRecord[]; stats: DecisionStats }>(`/decisions?limit=${limit}`),

  getReputationList: () => request<{ agents: ReputationRecord[] }>("/reputation"),

  getReputation: (agent: string) =>
    request<{ agent: string; score: string; tier: number; updatedAt: string }>(
      `/reputation/${agent}`,
    ),

  createCovenant: (payload: SetCovenantPayload) =>
    request<SetCovenantResponse>("/covenants", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export function createDecisionEventSource(
  onDecision: (event: DecisionEvent) => void,
  onError?: (error: Event) => void,
): EventSource {
  const source = new EventSource(`${API_BASE}/events/decisions`);

  source.addEventListener("decision", (message) => {
    try {
      const data = JSON.parse(message.data) as DecisionEvent;
      onDecision(data);
    } catch {
      // ignore malformed events
    }
  });

  source.onerror = (error) => {
    onError?.(error);
  };

  return source;
}
