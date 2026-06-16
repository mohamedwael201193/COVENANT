import { loadConfig, getChainConfig } from "../src/config.js";

try {
  const env = loadConfig();
  const chain = getChainConfig();
  console.log("Environment validation passed");
  console.log(JSON.stringify({
    chainId: env.PHAROS_CHAIN_ID,
    rpc: env.PHAROS_RPC_URL,
    contracts: chain.contracts,
    llmProviders: [
      env.CEREBRAS_API_KEY ? "cerebras" : null,
      env.SAMBANOVA_API_KEY ? "sambanova" : null,
      env.TOGETHER_API_KEY ? "together" : null,
      env.OPENROUTER_API_KEY ? "openrouter" : null,
      env.GROQ_API_KEY ? "groq" : null,
      env.GEMINI_API_KEY ? "gemini" : null,
    ].filter(Boolean),
  }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
