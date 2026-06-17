#!/usr/bin/env tsx
/**
 * Live testnet demo: register agent → set covenant → ALLOW execute → breach attempt.
 * Uses real Pharos Atlantic RPC and deployed contracts.
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  encodeFunctionData,
  keccak256,
  toHex,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  loadChainConfig,
  computeIntentHash,
  buildAllowAttestationTypedData,
  Verdict,
} from "covenant-shared";
import { abis } from "covenant-shared";

const IdentityRegistryAbi = abis.identityRegistry;
const CovenantRegistryAbi = abis.covenantRegistry;
const GuardedExecutorAbi = abis.guardedExecutor;

loadEnv({ path: resolve(process.cwd(), "../../.env") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const chain = loadChainConfig();
const pk = process.env.DEPLOYER_PRIVATE_KEY as Hex;
if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY required");

const account = privateKeyToAccount(pk);
const rpc = chain.rpcUrls.default.http[0]!;

const publicClient = createPublicClient({ transport: http(rpc) });
const walletClient = createWalletClient({ account, transport: http(rpc) });

const contracts = chain.contracts;

async function main() {
  const agentKey = privateKeyToAccount(
    keccak256(toHex("covenant-demo-agent-v1")) as Hex,
  );
  const agent = agentKey.address;

  console.log("Deployer:", account.address);
  console.log("Demo agent:", agent);

  // 1. Register agent
  const regHash = await walletClient.writeContract({
    address: contracts.identityRegistry,
    abi: IdentityRegistryAbi,
    functionName: "register",
    args: [agent, "ipfs://covenant-demo-agent-v1"],
  });
  await publicClient.waitForTransactionReceipt({ hash: regHash });
  console.log("Registered agent tx:", regHash);

  // 2. Set covenant
  const covenantTerms = {
    version: 1,
    caps: { maxValueWei: parseEther("0.01").toString() },
    allowList: [account.address],
    denyList: [] as string[],
    timeWindows: [] as { start: number; end: number }[],
    minCounterpartyTc: 0,
    requiredPreChecks: ["simulation", "rules"],
  };
  const covenantJson = JSON.stringify(covenantTerms);
  const covenantHash = keccak256(toHex(covenantJson));
  const tierCurveRef = keccak256(toHex("tier-curve-default"));

  const covHash = await walletClient.writeContract({
    address: contracts.covenantRegistry,
    abi: CovenantRegistryAbi,
    functionName: "setCovenant",
    args: [agent, covenantHash, tierCurveRef, "ipfs://covenant-demo-v1"],
  });
  await publicClient.waitForTransactionReceipt({ hash: covHash });
  console.log("Set covenant tx:", covHash);

  // 3. Successful guarded execution — call self with 0 value noop
  const nonce = BigInt(Date.now());
  const target = account.address as Address;
  const data = "0x" as Hex;
  const value = 0n;

  const intentHash = computeIntentHash({
    agent,
    target,
    data,
    value,
    nonce,
  });

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const typedData = buildAllowAttestationTypedData(
    {
      agent,
      intentHash,
      covenantHash,
      verdict: Verdict.ALLOW,
      deadline,
    },
    contracts.guardedExecutor,
    chain.chainId,
  );

  const signature = await account.signTypedData(typedData);

  const execHash = await walletClient.writeContract({
    address: contracts.guardedExecutor,
    abi: GuardedExecutorAbi,
    functionName: "execute",
    args: [
      { agent, target, data, value, nonce },
      covenantHash,
      deadline,
      Number(`0x${signature.slice(130, 132)}`),
      (`0x${signature.slice(2, 66)}` as Hex),
      (`0x${signature.slice(66, 130)}` as Hex),
    ],
  });
  await publicClient.waitForTransactionReceipt({ hash: execHash });
  console.log("Successful execution tx:", execHash);

  // 4. Breach attempt — wrong covenant hash
  const badNonce = nonce + 1n;
  const badIntentHash = computeIntentHash({
    agent,
    target,
    data,
    value,
    nonce: badNonce,
  });
  const badTyped = buildAllowAttestationTypedData(
    {
      agent,
      intentHash: badIntentHash,
      covenantHash: keccak256(toHex("wrong")),
      verdict: Verdict.ALLOW,
      deadline,
    },
    contracts.guardedExecutor,
    chain.chainId,
  );
  const badSig = await account.signTypedData(badTyped);

  try {
    await walletClient.writeContract({
      address: contracts.guardedExecutor,
      abi: GuardedExecutorAbi,
      functionName: "execute",
      args: [
        { agent, target, data, value, nonce: badNonce },
        keccak256(toHex("wrong")),
        deadline,
        Number(`0x${badSig.slice(130, 132)}`),
        (`0x${badSig.slice(2, 66)}` as Hex),
        (`0x${badSig.slice(66, 130)}` as Hex),
      ],
    });
    console.error("FAIL: breach should have reverted");
    process.exit(1);
  } catch {
    console.log("Breach correctly reverted (CovenantBreach)");
  }

  console.log("\nDemo complete. Explorer links:");
  const explorer = chain.blockExplorers.default.url;
  console.log(`  Register: ${explorer}/tx/${regHash}`);
  console.log(`  Covenant: ${explorer}/tx/${covHash}`);
  console.log(`  Execute:  ${explorer}/tx/${execHash}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
