export type CertikScanStatus =
  | "PASS"
  | "FAIL"
  | "ERROR"
  | "WAITING_FOR_OFFICIAL_ACCESS";

export interface CertikScanFinding {
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  detail: string;
  file?: string;
  line?: number;
}

export interface CertikScanResult {
  status: CertikScanStatus;
  score?: number;
  findings: CertikScanFinding[];
  scannedAt: string;
  message?: string;
}

export interface CertikAdapterConfig {
  scannerUrl?: string;
  apiKey?: string;
  enabled: boolean;
}

export interface CertikScanRequest {
  repositoryRoot: string;
  paths?: string[];
}
