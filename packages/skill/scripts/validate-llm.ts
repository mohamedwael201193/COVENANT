import { loadConfig } from "../src/config.js";
import { LlmExplainer, ruleBasedFallback } from "../src/engine/explainer.llm.js";

async function main(): Promise<void> {
  const env = loadConfig();
  const explainer = new LlmExplainer(env);
  if (!explainer.hasProviders()) {
    console.log("No LLM providers configured; rule fallback:");
    console.log(JSON.stringify(ruleBasedFallback([]), null, 2));
    return;
  }

  const result = await explainer.explain(
    [{ code: "TEST", message: "validation probe", severity: "warn" }],
    { probe: true },
  );
  console.log(JSON.stringify(result, null, 2));
  if ("suggestedVerdict" in result && result.suggestedVerdict === 2) {
    throw new Error("LLM emitted ALLOW — forbidden");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
