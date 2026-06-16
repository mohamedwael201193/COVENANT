import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { prisma, disconnectDb } from "../src/db/client.js";

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../..");
loadDotenv({ path: resolve(MONOREPO_ROOT, ".env") });

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  await prisma.$queryRaw`SELECT 1`;
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;

  console.log("Database connection OK");
  console.log(`Tables (${tables.length}):`, tables.map((t) => t.tablename).sort().join(", "));
  await disconnectDb();
}

main().catch((err) => {
  console.error("Database validation failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
