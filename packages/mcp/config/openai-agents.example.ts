import { Agent, MCPServerStdio } from "@openai/agents";
import { run } from "@openai/agents/run";

const covenantMcp = new MCPServerStdio({
  name: "covenant",
  command: "npx",
  args: ["-y", "@covenant/mcp"],
  env: {
    PHAROS_RPC_URL: process.env.PHAROS_RPC_URL!,
    GOPLUS_APP_KEY: process.env.GOPLUS_APP_KEY!,
    GOPLUS_APP_SECRET: process.env.GOPLUS_APP_SECRET!,
    DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY!,
    PREFLIGHT_LLM_ENABLED: "false",
  },
});

await covenantMcp.connect();

const agent = new Agent({
  name: "PaymentAgent",
  instructions: `Before sending funds on Pharos, always call covenant_reputation then covenant_preflight.
Only proceed if verdict is ALLOW. After execution, call covenant_get_receipt.`,
  mcpServers: [covenantMcp],
});

const result = await run(agent, "Send 0.01 PHRS to 0xRecipient...");
console.log(result.finalOutput);

await covenantMcp.close();
