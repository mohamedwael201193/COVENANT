import { createHash } from "node:crypto";
import { z } from "zod";
import type { Address } from "viem";
import type { RiskSignal } from "covenant-shared";
import type { EnvConfig } from "../config.js";
import { egressAllowlist, fetchWithEgress } from "../egress.js";

/** GoPlus does not list Pharos Atlantic; we map chainId to "unknown" gracefully */
const PHAROS_CHAIN_ID = 688689;

const tokenSecurityResultSchema = z.record(
  z.string(),
  z
    .object({
      is_honeypot: z.string().optional(),
      is_blacklisted: z.string().optional(),
      is_mintable: z.string().optional(),
      owner_change_balance: z.string().optional(),
      can_take_back_ownership: z.string().optional(),
      hidden_owner: z.string().optional(),
      selfdestruct: z.string().optional(),
      is_proxy: z.string().optional(),
      is_open_source: z.string().optional(),
      buy_tax: z.string().optional(),
      sell_tax: z.string().optional(),
    })
    .passthrough(),
);

const addressSecuritySchema = z.object({
  code: z.number(),
  message: z.string(),
  result: z
    .object({
      cybercrime: z.string().optional(),
      money_laundering: z.string().optional(),
      number_of_malicious_contracts_created: z.string().optional(),
      phishing_activities: z.string().optional(),
      stealer_program: z.string().optional(),
      sanctioned: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

function toDetails(record: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(record)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      out[key] = value;
    } else if (value !== undefined) {
      out[key] = String(value);
    }
  }
  return out;
}

function goplusSign(appKey: string, appSecret: string, timestamp: number): string {
  return createHash("sha1").update(`${appKey}${timestamp}${appSecret}`).digest("hex");
}

function buildAuthQuery(env: EnvConfig): string {
  const time = Math.floor(Date.now() / 1000);
  const sign = goplusSign(env.GOPLUS_APP_KEY, env.GOPLUS_APP_SECRET, time);
  return `app_key=${encodeURIComponent(env.GOPLUS_APP_KEY)}&time=${time}&sign=${sign}`;
}

function isTruthyFlag(value: string | undefined): boolean {
  return value === "1" || value === "true";
}

export class GoPlusClient {
  constructor(
    private readonly env: EnvConfig,
    private readonly allowedHosts = egressAllowlist,
  ) {}

  private baseUrl(path: string, query: Record<string, string>): string {
    const auth = buildAuthQuery(this.env);
    const params = new URLSearchParams({ ...query });
    return `${this.env.GOPLUS_API_BASE}${path}?${auth}&${params.toString()}`;
  }

  async checkAddress(address: Address): Promise<RiskSignal> {
    const url = this.baseUrl("/api/v1/address_security/" + address, {});
    const response = await fetchWithEgress(url, { method: "GET" }, this.allowedHosts);
    if (!response.ok) {
      return {
        source: "goplus",
        status: "unknown",
        details: { httpStatus: response.status, reason: "address_security_request_failed" },
      };
    }

    const json: unknown = await response.json();
    const parsed = addressSecuritySchema.safeParse(json);
    if (!parsed.success || parsed.data.code !== 1 || !parsed.data.result) {
      return {
        source: "goplus",
        status: "unknown",
        details: { reason: "no_address_data" },
      };
    }

    const r = parsed.data.result;
    const maliciousFlags = [
      isTruthyFlag(r.cybercrime),
      isTruthyFlag(r.money_laundering),
      isTruthyFlag(r.phishing_activities),
      isTruthyFlag(r.stealer_program),
      isTruthyFlag(r.sanctioned),
      Number(r.number_of_malicious_contracts_created ?? "0") > 0,
    ];

    if (maliciousFlags.some(Boolean)) {
      return {
        source: "goplus",
        status: "malicious",
        details: toDetails(r),
      };
    }

    return {
      source: "goplus",
      status: "safe",
      details: toDetails(r),
    };
  }

  async checkTokenContract(contractAddress: Address): Promise<RiskSignal> {
    const url = this.baseUrl(`/api/v1/token_security/${PHAROS_CHAIN_ID}`, {
      contract_addresses: contractAddress,
    });
    const response = await fetchWithEgress(url, { method: "GET" }, this.allowedHosts);
    if (!response.ok) {
      return {
        source: "goplus",
        status: "unknown",
        details: {
          httpStatus: response.status,
          reason: "pharos_chain_not_supported_or_rate_limited",
          chainId: PHAROS_CHAIN_ID,
        },
      };
    }

    const json: unknown = await response.json();
    const outer = z
      .object({
        code: z.number(),
        message: z.string(),
        result: tokenSecurityResultSchema.nullable(),
      })
      .safeParse(json);

    if (!outer.success || outer.data.code !== 1 || !outer.data.result) {
      return {
        source: "goplus",
        status: "unknown",
        details: {
          reason: "pharos_token_data_unavailable",
          chainId: PHAROS_CHAIN_ID,
          message: outer.success ? outer.data.message : "invalid_response",
        },
      };
    }

    const entry = outer.data.result[contractAddress.toLowerCase()];
    if (!entry) {
      return {
        source: "goplus",
        status: "unknown",
        details: { reason: "empty_token_result", chainId: PHAROS_CHAIN_ID },
      };
    }

    const malicious = [
      isTruthyFlag(entry.is_honeypot),
      isTruthyFlag(entry.is_blacklisted),
      isTruthyFlag(entry.can_take_back_ownership),
      isTruthyFlag(entry.hidden_owner),
      isTruthyFlag(entry.selfdestruct),
    ];

    if (malicious.some(Boolean)) {
      return { source: "goplus", status: "malicious", details: toDetails(entry) };
    }

    const warn = [
      isTruthyFlag(entry.is_mintable),
      isTruthyFlag(entry.owner_change_balance),
      isTruthyFlag(entry.is_proxy),
    ];

    if (warn.some(Boolean)) {
      return { source: "goplus", status: "warn", details: toDetails(entry) };
    }

    return { source: "goplus", status: "safe", details: toDetails(entry) };
  }

  async assessCounterparty(address: Address): Promise<RiskSignal> {
    const [addressRisk, tokenRisk] = await Promise.all([
      this.checkAddress(address),
      this.checkTokenContract(address),
    ]);

    if (addressRisk.status === "malicious" || tokenRisk.status === "malicious") {
      return {
        source: "goplus",
        status: "malicious",
        details: { addressStatus: addressRisk.status, tokenStatus: tokenRisk.status },
      };
    }

    if (addressRisk.status === "warn" || tokenRisk.status === "warn") {
      return {
        source: "goplus",
        status: "warn",
        details: { addressStatus: addressRisk.status, tokenStatus: tokenRisk.status },
      };
    }

    if (addressRisk.status === "unknown" && tokenRisk.status === "unknown") {
      return {
        source: "goplus",
        status: "unknown",
        details: { addressStatus: addressRisk.status, tokenStatus: tokenRisk.status },
      };
    }

    return {
      source: "goplus",
      status: "safe",
      details: { addressStatus: addressRisk.status, tokenStatus: tokenRisk.status },
    };
  }
}

export function riskToVerdictDowngrade(signal: RiskSignal): "deny" | "warn" | null {
  if (signal.status === "malicious") {
    return "deny";
  }
  if (signal.status === "warn") {
    return "warn";
  }
  return null;
}
