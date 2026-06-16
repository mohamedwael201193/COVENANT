import { URL } from "node:url";

const DEFAULT_ALLOWED_HOSTS = new Set([
  "api.zan.top",
  "atlantic.dplabs-internal.com",
  "api.gopluslabs.io",
  "api.cerebras.ai",
  "api.sambanova.ai",
  "api.together.xyz",
  "openrouter.ai",
  "api.groq.com",
  "generativelanguage.googleapis.com",
  "api.pinata.cloud",
  "atlantic.pharosscan.xyz",
]);

export class EgressViolationError extends Error {
  constructor(public readonly url: string) {
    super(`Egress blocked: ${url} is not on the allowlist`);
    this.name = "EgressViolationError";
  }
}

export function parseAllowedHosts(extra?: string[]): Set<string> {
  const hosts = new Set(DEFAULT_ALLOWED_HOSTS);
  for (const entry of extra ?? []) {
    hosts.add(entry.toLowerCase());
  }
  return hosts;
}

export function assertEgressAllowed(rawUrl: string, allowedHosts: Set<string>): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new EgressViolationError(rawUrl);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new EgressViolationError(rawUrl);
  }

  const host = parsed.hostname.toLowerCase();
  if (!allowedHosts.has(host)) {
    throw new EgressViolationError(rawUrl);
  }

  return parsed;
}

export async function fetchWithEgress(
  rawUrl: string,
  init: RequestInit,
  allowedHosts: Set<string>,
): Promise<Response> {
  assertEgressAllowed(rawUrl, allowedHosts);
  return fetch(rawUrl, init);
}

export const egressAllowlist = parseAllowedHosts();
