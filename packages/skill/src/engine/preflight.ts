import {
  createAllowAttestationMessage,
  computeIntentHash,
  TrustCapitalTier,
  Verdict,
  type PreflightResult,
} from "covenant-shared";
import type { ChainClients } from "../chain/clients.js";
import { readReputation } from "../chain/clients.js";
import { signAllowAttestation } from "../chain/signer.js";
import type { EnvConfig } from "../config.js";
import { LlmExplainer } from "./explainer.llm.js";
import type { PreflightRequest } from "./schema.js";
import { parsePreflightContext } from "./schema.js";
import { evaluateRules, mergeVerdicts, validateIntentShape } from "./rules.js";
import { GoPlusClient, riskToVerdictDowngrade } from "./riskRead.goplus.js";
import { simulateIntent } from "./simulator.js";

export interface PreflightServices {
  clients: ChainClients;
  env: EnvConfig;
  goplus: GoPlusClient;
  explainer: LlmExplainer;
}

export async function runPreflight(
  services: PreflightServices,
  request: PreflightRequest,
): Promise<PreflightResult> {
  const ctx = parsePreflightContext(request);
  const intentHash = computeIntentHash(ctx.intent);

  const shapeViolations = validateIntentShape(ctx.intent);
  let agentTier = TrustCapitalTier.BRONZE;
  try {
    const rep = await readReputation(services.clients, ctx.intent.agent);
    agentTier = rep.tier as TrustCapitalTier;
  } catch {
    agentTier = TrustCapitalTier.UNTRUSTED;
  }

  const rules = evaluateRules(ctx, agentTier);
  const allViolations = [...shapeViolations, ...rules.violations];
  let verdict = mergeVerdicts(rules.verdict);

  const simulation = await simulateIntent(services.clients, ctx.intent);
  if (ctx.covenant.requiredChecks.includes("simulation") && !simulation.success) {
    allViolations.push({
      code: "SIMULATION_REVERT",
      message: simulation.revertReason ?? "eth_call simulation reverted",
      severity: "deny",
    });
    verdict = Verdict.DENY;
  }

  let risk;
  if (ctx.covenant.requiredChecks.includes("goplus")) {
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
  }

  const explanation = await services.explainer.explain(allViolations, {
    intentHash,
    target: ctx.intent.target,
    value: ctx.intent.value.toString(),
    simulationSuccess: simulation.success,
    riskStatus: risk?.status,
  });

  if (explanation.anomalyFlag && verdict === Verdict.ALLOW) {
    verdict = Verdict.WARN;
  }
  if (
    explanation.suggestedVerdict === Verdict.DENY ||
    explanation.suggestedVerdict === Verdict.WARN
  ) {
    if (explanation.suggestedVerdict === Verdict.DENY) {
      verdict = Verdict.DENY;
    } else if (verdict === Verdict.ALLOW) {
      verdict = Verdict.WARN;
    }
  }

  const result: PreflightResult = {
    verdict,
    intentHash,
    violations: allViolations,
    simulation,
    risk,
    explanation: explanation.summary,
  };

  if (verdict === Verdict.ALLOW) {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + request.deadlineSeconds);
    const attestation = createAllowAttestationMessage(
      ctx.intent.agent,
      intentHash,
      ctx.covenantHash,
      deadline,
    );
    result.attestation = await signAllowAttestation(services.clients, attestation);
  }

  return result;
}
