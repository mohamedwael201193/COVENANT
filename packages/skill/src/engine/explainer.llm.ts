import { z } from "zod";
import { Verdict, type LlmExplanation, type RuleViolation } from "@covenant/shared";
import type { EnvConfig } from "../config.js";
import { egressAllowlist, fetchWithEgress } from "../egress.js";
import { llmExplanationSchema } from "./schema.js";

const DEFAULT_PROVIDER_TIMEOUT_MS = 2000;

interface LlmProvider {
  name: string;
  enabled: boolean;
  complete: (system: string, user: string, timeoutMs: number) => Promise<string>;
}

const EXPLANATION_JSON_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    intentClassification: { type: "string" },
    anomalyFlag: { type: "boolean" },
    suggestedVerdict: { type: "string", enum: ["DENY", "WARN"] },
  },
  required: ["summary", "intentClassification", "anomalyFlag"],
  additionalProperties: false,
} as const;

function buildSystemPrompt(): string {
  return [
    "You are a read-only security explainer for COVENANT agent transactions.",
    "You MUST NOT authorize fund movement. Never output ALLOW as a verdict.",
    "Respond with JSON only matching the schema.",
    "suggestedVerdict may only be DENY or WARN, never ALLOW.",
    "anomalyFlag can only lower trust when true.",
  ].join(" ");
}

function ruleBasedFallback(violations: RuleViolation[]): LlmExplanation {
  const deny = violations.filter((v) => v.severity === "deny");
  const warn = violations.filter((v) => v.severity === "warn");
  const primary = deny[0] ?? warn[0];
  return {
    summary: primary
      ? `${primary.code}: ${primary.message}`
      : "No policy violations detected by deterministic rules.",
    intentClassification: "contract_call",
    anomalyFlag: deny.length > 0,
    suggestedVerdict: deny.length > 0 ? Verdict.DENY : warn.length > 0 ? Verdict.WARN : undefined,
  };
}

async function fetchJson(url: string, init: RequestInit): Promise<unknown> {
  const response = await fetchWithEgress(url, init, egressAllowlist);
  if (!response.ok) {
    throw new Error(`LLM HTTP ${response.status}`);
  }
  return response.json();
}

function createProviders(env: EnvConfig): LlmProvider[] {
  const providers: LlmProvider[] = [];

  if (env.CEREBRAS_API_KEY && env.CEREBRAS_MODEL) {
    providers.push({
      name: "cerebras",
      enabled: true,
      complete: async (system, user, timeoutMs) => {
        const json = await fetchJson("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.CEREBRAS_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: env.CEREBRAS_MODEL,
            temperature: 0,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            response_format: { type: "json_object" },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        const parsed = zodChatResponse.parse(json);
        return parsed.choices[0]?.message?.content ?? "";
      },
    });
  }

  if (env.SAMBANOVA_API_KEY && env.SAMBANOVA_MODEL) {
    providers.push({
      name: "sambanova",
      enabled: true,
      complete: async (system, user, timeoutMs) => {
        const json = await fetchJson("https://api.sambanova.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.SAMBANOVA_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: env.SAMBANOVA_MODEL,
            temperature: 0,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        const parsed = zodChatResponse.parse(json);
        return parsed.choices[0]?.message?.content ?? "";
      },
    });
  }

  if (env.TOGETHER_API_KEY && env.TOGETHER_MODEL) {
    providers.push({
      name: "together",
      enabled: true,
      complete: async (system, user, timeoutMs) => {
        const json = await fetchJson("https://api.together.xyz/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.TOGETHER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: env.TOGETHER_MODEL,
            temperature: 0,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            response_format: { type: "json_object" },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        const parsed = zodChatResponse.parse(json);
        return parsed.choices[0]?.message?.content ?? "";
      },
    });
  }

  if (env.OPENROUTER_API_KEY && env.OPENROUTER_MODEL) {
    providers.push({
      name: "openrouter",
      enabled: true,
      complete: async (system, user, timeoutMs) => {
        const json = await fetchJson("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: env.OPENROUTER_MODEL,
            temperature: 0,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            response_format: { type: "json_object" },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        const parsed = zodChatResponse.parse(json);
        return parsed.choices[0]?.message?.content ?? "";
      },
    });
  }

  if (env.GROQ_API_KEY && env.GROQ_MODEL) {
    providers.push({
      name: "groq",
      enabled: true,
      complete: async (system, user, timeoutMs) => {
        const json = await fetchJson("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: env.GROQ_MODEL,
            temperature: 0,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            response_format: { type: "json_object" },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        const parsed = zodChatResponse.parse(json);
        return parsed.choices[0]?.message?.content ?? "";
      },
    });
  }

  if (env.GEMINI_API_KEY && env.GEMINI_MODEL) {
    providers.push({
      name: "gemini",
      enabled: true,
      complete: async (system, user, timeoutMs) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
        const json = await fetchJson(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: user }] }],
            generationConfig: { temperature: 0, responseMimeType: "application/json" },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        const parsed = geminiResponseSchema.parse(json);
        return parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      },
    });
  }

  return providers;
}

const zodChatResponse = z.object({
  choices: z.array(
    z.object({
      message: z.object({ content: z.string().nullable().optional() }).optional(),
    }),
  ),
});

const geminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(z.object({ text: z.string().optional() })).optional(),
        }),
      }),
    )
    .optional(),
});

function sanitizeLlmOutput(raw: string, violations: RuleViolation[]): LlmExplanation {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return ruleBasedFallback(violations);
  }

  const withVerdict = (() => {
    if (
      typeof parsedJson === "object" &&
      parsedJson !== null &&
      "suggestedVerdict" in parsedJson &&
      typeof (parsedJson as { suggestedVerdict: unknown }).suggestedVerdict === "string"
    ) {
      const sv = (parsedJson as { suggestedVerdict: string }).suggestedVerdict.toUpperCase();
      if (sv === "ALLOW") {
        return { ...parsedJson, suggestedVerdict: "DENY" };
      }
    }
    return parsedJson;
  })();

  const mapped =
    typeof withVerdict === "object" &&
    withVerdict !== null &&
    "suggestedVerdict" in withVerdict &&
    typeof (withVerdict as { suggestedVerdict?: string }).suggestedVerdict === "string"
      ? {
          ...withVerdict,
          suggestedVerdict:
            (withVerdict as { suggestedVerdict: string }).suggestedVerdict === "WARN"
              ? Verdict.WARN
              : Verdict.DENY,
        }
      : withVerdict;

  const validated = llmExplanationSchema.safeParse(mapped);
  if (!validated.success) {
    return ruleBasedFallback(violations);
  }

  if (validated.data.anomalyFlag && !validated.data.suggestedVerdict) {
    return { ...validated.data, suggestedVerdict: Verdict.WARN };
  }

  return validated.data;
}

export class LlmExplainer {
  private readonly providers: LlmProvider[];
  private readonly enabled: boolean;
  private readonly budgetMs: number;

  constructor(env: EnvConfig) {
    this.providers = createProviders(env);
    this.enabled = env.PREFLIGHT_LLM_ENABLED !== false;
    this.budgetMs = env.PREFLIGHT_LLM_TIMEOUT_MS;
  }

  hasProviders(): boolean {
    return this.enabled && this.providers.some((p) => p.enabled);
  }

  async explain(
    violations: RuleViolation[],
    context: Record<string, unknown>,
  ): Promise<LlmExplanation> {
    if (!this.enabled || this.providers.length === 0) {
      return ruleBasedFallback(violations);
    }

    const userPayload = JSON.stringify({
      schema: EXPLANATION_JSON_SCHEMA,
      violations,
      context,
    });
    const system = buildSystemPrompt();
    const deadline = Date.now() + this.budgetMs;

    for (const provider of this.providers) {
      if (!provider.enabled) {
        continue;
      }
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        break;
      }
      try {
        const raw = await provider.complete(
          system,
          userPayload,
          Math.min(DEFAULT_PROVIDER_TIMEOUT_MS, remaining),
        );
        if (!raw.trim()) {
          continue;
        }
        return sanitizeLlmOutput(raw, violations);
      } catch {
        continue;
      }
    }

    return ruleBasedFallback(violations);
  }
}

export { ruleBasedFallback };
