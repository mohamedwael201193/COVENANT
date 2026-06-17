import {
  computeIntentHash,
  TrustCapitalTier,
  Verdict,
  type PreflightResult,
} from "covenant-shared";
import type { ChainClients } from "../chain/clients.js";
import { readReputation } from "../chain/clients.js";
import type { EnvConfig } from "../config.js";
import { LlmExplainer } from "./explainer.llm.js";
import type { GoPlusClient } from "./riskRead.goplus.js";
import type { PreflightRequest } from "./schema.js";
import { parsePreflightContext } from "./schema.js";
import { evaluateRules, mergeVerdicts, validateIntentShape } from "./rules.js";
import { riskToVerdictDowngrade } from "./riskRead.goplus.js";
import { simulateIntent } from "./simulator.js";

export interface PreflightServices {
  clients: ChainClients;
  env: EnvConfig;
  goplus: GoPlusClient | null;
  explainer: LlmExplainer;
}

export interface EvaluateOptions {
  skipGoPlusIfUnavailable?: boolean;
  skipLlm?: boolean;
}

const DEFAULT_REPUTATION_TIMEOUT_MS = 500;

async function readReputationTierWithTimeout(
  services: PreflightServices,
  agent: `0x${string}`,
): Promise<{ tier: TrustCapitalTier; unavailable: boolean }> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      readReputation(services.clients, agent).then((rep) => ({
        tier: rep.tier as TrustCapitalTier,
        unavailable: false,
      })),
      new Promise<{ tier: TrustCapitalTier; unavailable: boolean }>((resolve) => {
        timeout = setTimeout(
          () => resolve({ tier: TrustCapitalTier.UNTRUSTED, unavailable: true }),
          DEFAULT_REPUTATION_TIMEOUT_MS,
        );
      }),
    ]);
    return result;
  } catch {
    return { tier: TrustCapitalTier.UNTRUSTED, unavailable: true };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

/** Deterministic evaluation only — no attestation signing, no secrets required. */
export async function runPreflightEvaluate(
  services: PreflightServices,
  request: PreflightRequest,
  options: EvaluateOptions = {},
): Promise<PreflightResult> {
  const skipGoPlus = options.skipGoPlusIfUnavailable ?? true;
  const skipLlm = options.skipLlm ?? services.env.PREFLIGHT_LLM_ENABLED === false;

  const ctx = parsePreflightContext(request);
  const intentHash = computeIntentHash(ctx.intent);

  const shapeViolations = validateIntentShape(ctx.intent);
  const rep = await readReputationTierWithTimeout(services, ctx.intent.agent);
  const agentTier = rep.tier;
  if (rep.unavailable) {
    shapeViolations.push({
      code: "REPUTATION_UNAVAILABLE",
      message:
        "Trust Capital read timed out or failed; using conservative tier 0 for this preflight.",
      severity: "warn",
    });
  }

  const rules = evaluateRules(ctx, agentTier);
  const allViolations = [...shapeViolations, ...rules.violations];
  let verdict = mergeVerdicts(rules.verdict);
  if (allViolations.some((v) => v.severity === "warn") && verdict === Verdict.ALLOW) {
    verdict = Verdict.WARN;
  }

  const simulation = await simulateIntent(services.clients, ctx.intent);
  if (ctx.covenant.requiredChecks.includes("simulation") && !simulation.success) {
    allViolations.push({
      code: simulation.rpcUnavailable ? "RPC_UNAVAILABLE" : "SIMULATION_REVERT",
      message: simulation.revertReason ?? "eth_call simulation reverted",
      severity: "deny",
    });
    verdict = Verdict.DENY;
  }

  let risk;
  const wantsGoPlus = ctx.covenant.requiredChecks.includes("goplus");
  if (wantsGoPlus && services.goplus) {
    risk = await services.goplus.assessCounterparty(ctx.intent.target);
    const downgrade = riskToVerdictDowngrade(risk);
    if (downgrade === "deny") {
      allViolations.push({
        code: "GOPLUS_MALICIOUS",
        message: "GoPlus flagged counterparty as malicious",
        severity: "deny",
      });
      verdict = Verdict.DENY;
    } else if (downgrade === "warn" && verdict === Verdict.ALLOW) {
      allViolations.push({
        code: "GOPLUS_WARN",
        message: "GoPlus raised warnings for counterparty",
        severity: "warn",
      });
      verdict = Verdict.WARN;
    }
  } else if (wantsGoPlus && skipGoPlus) {
    allViolations.push({
      code: "GOPLUS_SKIPPED",
      message:
        "GoPlus check skipped (no API credentials). Use hosted COVENANT_API_URL or covenant_verify_counterparty.",
      severity: "warn",
    });
    if (verdict === Verdict.ALLOW) {
      verdict = Verdict.WARN;
    }
  }

  let explanation = "";
  if (!skipLlm) {
    const llm = await services.explainer.explain(allViolations, {
      intentHash,
      target: ctx.intent.target,
      value: ctx.intent.value.toString(),
      simulationSuccess: simulation.success,
      riskStatus: risk?.status,
    });
    explanation = llm.summary;
    if (llm.anomalyFlag && verdict === Verdict.ALLOW) {
      verdict = Verdict.WARN;
    }
    if (llm.suggestedVerdict === Verdict.DENY) {
      verdict = Verdict.DENY;
    } else if (llm.suggestedVerdict === Verdict.WARN && verdict === Verdict.ALLOW) {
      verdict = Verdict.WARN;
    }
  } else if (allViolations.length > 0) {
    explanation = allViolations.map((v) => v.message).join("; ");
  } else {
    explanation = "Deterministic checks passed.";
  }

  return {
    verdict,
    intentHash,
    violations: allViolations,
    simulation,
    risk,
    explanation,
  };
}
