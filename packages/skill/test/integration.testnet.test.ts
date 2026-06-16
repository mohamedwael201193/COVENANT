import { describe, expect, it } from "vitest";
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { createPublicClient, http } from "viem";
import { abis, loadChainConfig, PHAROS_ATLANTIC_CHAIN_ID } from "@covenant/shared";
import { probeRpcCapabilities } from "../src/engine/simulator.js";

loadDotenv({ path: resolve(import.meta.dirname, "../../../.env") });

const chainConfig = loadChainConfig(process.env);
const rpcUrl = process.env.PHAROS_RPC_URL ?? chainConfig.rpcUrls.default.http[0];

describe("Pharos testnet read-only integration", () => {
  it("connects to Pharos Atlantic RPC with expected chainId", async () => {
    const client = createPublicClient({ transport: http(rpcUrl) });
    const chainId = await client.getChainId();
    expect(chainId).toBe(PHAROS_ATLANTIC_CHAIN_ID);
  });

  it("probes RPC simulation capabilities", async () => {
    const client = createPublicClient({ transport: http(rpcUrl) });
    const caps = await probeRpcCapabilities(client);
    expect(caps.ethCall).toBe(true);
    expect(caps.chainId).toBe(PHAROS_ATLANTIC_CHAIN_ID);
  });

  it("reads GuardedExecutor attester when contract bytecode exists", async () => {
    const client = createPublicClient({ transport: http(rpcUrl) });
    const address = chainConfig.contracts.guardedExecutor;
    const bytecode = await client.getBytecode({ address });
    if (!bytecode || bytecode === "0x") {
      console.warn(`Skipping attester read: no bytecode at ${address}`);
      return;
    }

    const attester = (await client.readContract({
      address,
      abi: abis.guardedExecutor,
      functionName: "attester",
    })) as string;

    expect(attester.toLowerCase()).toBe(chainConfig.contracts.attester.toLowerCase());
  });
});
