import { loadConfig } from "../src/config.js";
import { GoPlusClient } from "../src/engine/riskRead.goplus.js";

const TEST_ADDRESS = "0x0000000000000000000000000000000000000001";

async function main(): Promise<void> {
  const env = loadConfig();
  const client = new GoPlusClient(env);
  const result = await client.assessCounterparty(TEST_ADDRESS);
  console.log("GoPlus validation response:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
