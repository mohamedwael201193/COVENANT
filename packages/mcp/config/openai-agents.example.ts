import { Agent, MCPServerStdio, hostedMcpTool } from "@openai/agents";
import { run } from "@openai/agents/run";

// Recommended for public agent runtimes: hosted MCP, no local install.
export const hostedCovenantTool = hostedMcpTool({
  serverLabel: "covenant",
  serverUrl: "https://covenant-skill.onrender.com/mcp",
  requireApproval: "never",
});

// Local fallback for developer machines: zero-secret stdio.
const covenantMcp = new MCPServerStdio({
  name: "covenant",
  command: "npx",
  args: ["-y", "covenant-mcp"],
  env: {
    PREFLIGHT_LLM_ENABLED: "false",
  },
});

await covenantMcp.connect();

const agent = new Agent({
  name: "PaymentAgent",
  instructions: `Before sending funds on Pharos, always call covenant_reputation then covenant_preflight.
Only proceed if verdict is ALLOW. After execution, call covenant_get_receipt.`,
  tools: [hostedCovenantTool],
  mcpServers: [covenantMcp],
});

const result = await run(agent, "Send 0.01 PHRS to 0xRecipient...");
console.log(result.finalOutput);

await covenantMcp.close();
