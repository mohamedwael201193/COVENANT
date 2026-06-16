import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contractsOut = resolve(__dirname, "../../contracts/out");
const abisDir = resolve(__dirname, "../src/abis");

const CONTRACTS = [
  { name: "IdentityRegistry", path: "IdentityRegistry.sol/IdentityRegistry.json" },
  { name: "CovenantRegistry", path: "CovenantRegistry.sol/CovenantRegistry.json" },
  { name: "DecisionLog", path: "DecisionLog.sol/DecisionLog.json" },
  { name: "ReputationRegistry", path: "ReputationRegistry.sol/ReputationRegistry.json" },
  { name: "GuardedExecutor", path: "GuardedExecutor.sol/GuardedExecutor.json" },
];

mkdirSync(abisDir, { recursive: true });

for (const { name, path } of CONTRACTS) {
  const sourcePath = join(contractsOut, path);
  if (!existsSync(sourcePath)) {
    throw new Error(`Missing forge artifact: ${sourcePath}. Run forge build in packages/contracts.`);
  }
  const artifact = JSON.parse(readFileSync(sourcePath, "utf8"));
  const outPath = join(abisDir, `${name}.json`);
  writeFileSync(outPath, JSON.stringify(artifact.abi, null, 2));
  console.log(`Wrote ${outPath}`);
}
