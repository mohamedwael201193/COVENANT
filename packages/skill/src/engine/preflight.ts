import { createAllowAttestationMessage, Verdict, type PreflightResult } from "covenant-shared";
import type { PreflightServices } from "./preflightEvaluate.js";
import { runPreflightEvaluate, type EvaluateOptions } from "./preflightEvaluate.js";
import type { PreflightRequest } from "./schema.js";
import { parsePreflightContext } from "./schema.js";
import { signAllowAttestation } from "../chain/signer.js";

export type { PreflightServices } from "./preflightEvaluate.js";
export { runPreflightEvaluate, type EvaluateOptions } from "./preflightEvaluate.js";

/** Full pipeline: evaluate + sign ALLOW attestation (requires attester key). */
export async function runPreflight(
  services: PreflightServices,
  request: PreflightRequest,
  options?: EvaluateOptions,
): Promise<PreflightResult> {
  const result = await runPreflightEvaluate(services, request, options);

  if (result.verdict === Verdict.ALLOW) {
    const ctx = parsePreflightContext(request);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + request.deadlineSeconds);
    const attestation = createAllowAttestationMessage(
      ctx.intent.agent,
      result.intentHash,
      ctx.covenantHash,
      deadline,
    );
    result.attestation = await signAllowAttestation(services.clients, attestation);
  }

  return result;
}
