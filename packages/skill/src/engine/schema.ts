import { z } from "zod";
import {
  TrustCapitalTier,
  Verdict,
  type CovenantTerms,
  type Intent,
  type PreflightContext,
  type RuleViolation,
} from "covenant-shared";

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const hexSchema = z.string().regex(/^0x([a-fA-F0-9]*|)$/);

export const intentSchema = z.object({
  agent: addressSchema,
  target: addressSchema,
  data: hexSchema,
  value: z.union([z.string(), z.number(), z.bigint()]).transform((v) => BigInt(v)),
  nonce: z.union([z.string(), z.number(), z.bigint()]).transform((v) => BigInt(v)),
});

export const tierLimitSchema = z.object({
  tier: z.nativeEnum(TrustCapitalTier),
  maxValueWei: z.string(),
});

export const timeWindowSchema = z.object({
  startHourUtc: z.number().int().min(0).max(23),
  endHourUtc: z.number().int().min(0).max(23),
});

export const covenantTermsSchema = z.object({
  version: z.literal("1"),
  agent: addressSchema,
  owner: addressSchema,
  allowlist: z.array(addressSchema),
  denylist: z.array(addressSchema),
  baseMaxValueWei: z.string(),
  tierLimits: z.array(tierLimitSchema),
  minCounterpartyTier: z.nativeEnum(TrustCapitalTier),
  timeWindows: z.array(timeWindowSchema),
  requiredChecks: z.array(z.enum(["simulation", "goplus"])),
  label: z.string().optional(),
  createdAt: z.string(),
});

export const preflightRequestSchema = z.object({
  intent: intentSchema,
  covenant: covenantTermsSchema,
  covenantHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  counterpartyTier: z.nativeEnum(TrustCapitalTier).optional(),
  deadlineSeconds: z.number().int().positive().default(3600),
});

export const simulateRequestSchema = z.object({
  intent: intentSchema,
  from: addressSchema.optional(),
});

export const registerIdentitySchema = z.object({
  agent: addressSchema,
  metadataURI: z.string().min(1).max(2048),
  ownerPrivateKey: privateKeySchema(),
});

export const setCovenantSchema = z.object({
  agent: addressSchema,
  covenant: covenantTermsSchema,
  ipfsURI: z.string().min(1).max(2048),
  ownerPrivateKey: privateKeySchema(),
});

export const verifyCounterpartySchema = z.object({
  address: addressSchema,
});

export const attestOutcomeSchema = z.object({
  agent: addressSchema,
  score: z.union([z.string(), z.number(), z.bigint()]).transform((v) => BigInt(v)),
  tier: z.number().int().min(0).max(4),
  decisionIds: z.array(z.union([z.string(), z.number(), z.bigint()]).transform((v) => BigInt(v))),
});

export const getReceiptSchema = z.object({
  decisionId: z.union([z.string(), z.number(), z.bigint()]).transform((v) => BigInt(v)),
});

export const reputationSchema = z.object({
  agent: addressSchema,
});

export const rotateKeySchema = z.object({
  newAgent: addressSchema,
  ownerPrivateKey: privateKeySchema(),
});

export const llmExplanationSchema = z.object({
  summary: z.string(),
  intentClassification: z.string(),
  anomalyFlag: z.boolean(),
  suggestedVerdict: z.union([z.literal(Verdict.DENY), z.literal(Verdict.WARN)]).optional(),
});

function privateKeySchema() {
  return z.string().regex(/^0x[a-fA-F0-9]{64}$/);
}

export type PreflightRequest = z.infer<typeof preflightRequestSchema>;
export type SimulateRequest = z.infer<typeof simulateRequestSchema>;

export function parsePreflightContext(input: z.infer<typeof preflightRequestSchema>): PreflightContext {
  return {
    intent: {
      agent: input.intent.agent as Intent["agent"],
      target: input.intent.target as Intent["target"],
      data: input.intent.data as Intent["data"],
      value: input.intent.value,
      nonce: input.intent.nonce,
    },
    covenant: {
      ...input.covenant,
      agent: input.covenant.agent as CovenantTerms["agent"],
      owner: input.covenant.owner as CovenantTerms["owner"],
      allowlist: input.covenant.allowlist as CovenantTerms["allowlist"],
      denylist: input.covenant.denylist as CovenantTerms["denylist"],
    },
    covenantHash: input.covenantHash as PreflightContext["covenantHash"],
    counterpartyTier: input.counterpartyTier,
    nowUtc: new Date(),
  };
}

export function verdictLabel(verdict: Verdict): string {
  switch (verdict) {
    case Verdict.ALLOW:
      return "ALLOW";
    case Verdict.WARN:
      return "WARN";
    case Verdict.DENY:
      return "DENY";
    default:
      return "UNKNOWN";
  }
}

export type { RuleViolation };
