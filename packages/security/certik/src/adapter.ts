import type { CertikAdapterConfig, CertikScanRequest, CertikScanResult } from "./types.js";

export function isCertikConfigured(config: CertikAdapterConfig): boolean {
  return (
    config.enabled &&
    Boolean(config.scannerUrl && config.scannerUrl.trim().length > 0) &&
    Boolean(config.apiKey && config.apiKey.trim().length > 0)
  );
}

export function waitingResult(message?: string): CertikScanResult {
  return {
    status: "WAITING_FOR_OFFICIAL_ACCESS",
    findings: [],
    scannedAt: new Date().toISOString(),
    message:
      message ??
      "CertiK Skill Scanner is not configured. Set CERTIK_SCANNER_URL, CERTIK_SCANNER_API_KEY, and CERTIK_SCANNER_ENABLED=true when access is granted.",
  };
}

export async function runCertikScan(
  config: CertikAdapterConfig,
  request: CertikScanRequest,
): Promise<CertikScanResult> {
  if (!isCertikConfigured(config)) {
    return waitingResult();
  }

  const url = new URL("/scan", config.scannerUrl!.replace(/\/$/, ""));
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      root: request.repositoryRoot,
      paths: request.paths,
    }),
  });

  if (!response.ok) {
    return {
      status: "ERROR",
      findings: [],
      scannedAt: new Date().toISOString(),
      message: `CertiK scanner HTTP ${response.status}: ${await response.text()}`,
    };
  }

  const body = (await response.json()) as {
    status?: string;
    score?: number;
    findings?: CertikScanResult["findings"];
  };

  const status = body.status === "PASS" || body.status === "FAIL" ? body.status : "ERROR";

  return {
    status,
    score: body.score,
    findings: body.findings ?? [],
    scannedAt: new Date().toISOString(),
  };
}
