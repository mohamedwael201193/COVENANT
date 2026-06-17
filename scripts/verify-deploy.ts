#!/usr/bin/env tsx
/**
 * Post-deploy verification: bytecode, attester, chainId, health.
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { createPublicClient, http } from "viem";
import { loadChainConfig, abis } from "covenant-shared";

loadEnv({ path: resolve(process.cwd(), ".env") });

const chain = loadChainConfig();

async function main(): Promise<void> {
  const rpc = chain.rpcUrls.default.http[0]!;
  const client = createPublicClient({ transport: http(rpc) });

  const chainId = await client.getChainId();
  if (chainId !== 688689) {
    throw new Error(`Expected chainId 688689, got ${chainId}`);
  }
  console.log("✓ chainId", chainId);

  const contracts = chain.contracts;
  for (const [name, address] of Object.entries(contracts)) {
    if (name === "attester") continue;
    const code = await client.getBytecode({ address });
    if (!code || code === "0x") {
      throw new Error(`No bytecode at ${name} ${address}`);
    }
    console.log(`✓ ${name} bytecode (${(code.length - 2) / 2} bytes)`);
  }

  const attester = (await client.readContract({
    address: contracts.guardedExecutor,
    abi: abis.guardedExecutor,
    functionName: "attester",
  })) as string;

  if (attester.toLowerCase() !== contracts.attester.toLowerCase()) {
    throw new Error(`Attester mismatch: on-chain ${attester} vs env ${contracts.attester}`);
  }
  console.log("✓ attester match", attester);

  console.log("\nAll on-chain verifications passed.");
  console.log("Explorer links:");
  const base = chain.blockExplorers.default.url;
  for (const [name, address] of Object.entries(contracts)) {
    if (name === "attester") continue;
    console.log(`  ${name}: ${base}/address/${address}`);
  }
}

main().catch((err) => {
  console.error("VERIFY FAILED:", err.message ?? err);
  process.exit(1);
});
