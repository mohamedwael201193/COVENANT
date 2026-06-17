/** Optional hosted COVENANT skill for attestation signing (no local keys). */
export async function hostedSignAttestation(
  apiBase: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const base = apiBase.replace(/\/$/, "");
  const res = await fetch(`${base}/api/attest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Hosted attestation failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function hostedPreflightEvaluate(
  apiBase: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const base = apiBase.replace(/\/$/, "");
  const res = await fetch(`${base}/api/preflight/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Hosted preflight failed (${res.status}): ${text}`);
  }
  return res.json();
}
