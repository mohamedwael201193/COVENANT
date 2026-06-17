/** Route session MCP tools through hosted REST API when no local DATABASE_URL. */
const DEFAULT_API = "https://covenant-skill.onrender.com";

export function sessionApiBase(): string | null {
  if (process.env.DATABASE_URL || process.env.COVENANT_SESSION_STORE === "memory") return null;
  return (process.env.COVENANT_API_URL ?? DEFAULT_API).replace(/\/$/, "");
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = sessionApiBase();
  if (!base) throw new Error("sessionApiBase called without remote mode");
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof body === "object" && body && "error" in body ? String(body.error) : res.statusText;
    throw new Error(msg);
  }
  return body as T;
}

export async function remoteConnectWallet(args: unknown) {
  return apiJson("/api/sessions/connect", { method: "POST", body: JSON.stringify(args) });
}

export async function remoteCreateSession(args: unknown) {
  return apiJson("/api/sessions", { method: "POST", body: JSON.stringify(args) });
}

export async function remoteRequestApproval(args: unknown) {
  return apiJson("/api/approvals/request", { method: "POST", body: JSON.stringify(args) });
}

export async function remoteGetPendingApprovals(sessionId: string) {
  return apiJson(`/api/approvals/pending/${sessionId}`);
}

export async function remoteExecuteAuthorized(approvalId: string) {
  return apiJson(`/api/approvals/${approvalId}/status`);
}

export async function remoteRevokeSession(sessionId: string) {
  return apiJson(`/api/sessions/${sessionId}/revoke`, { method: "POST" });
}
