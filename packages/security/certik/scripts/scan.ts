import { scanRepository, MONOREPO_ROOT } from "../src/scan.js";

async function main(): Promise<void> {
  const result = await scanRepository(MONOREPO_ROOT);

  console.log(JSON.stringify(result, null, 2));

  if (result.status === "WAITING_FOR_OFFICIAL_ACCESS") {
    console.log("CertiK scan skipped — waiting for official scanner access.");
    process.exit(0);
  }

  if (result.status !== "PASS") {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
