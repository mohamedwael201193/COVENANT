import pg from "pg";

/** Supabase pooler URLs include sslmode=require which makes pg verify certs and crash on Render. */
export function buildPgPoolConfig(connectionString: string): pg.PoolConfig {
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  if (isLocal) {
    return { connectionString, max: 10 };
  }

  const cleaned = connectionString
    .replace(/([?&])sslmode=[^&]*(?=&|$)/g, "$1")
    .replace(/[?&]$/, "")
    .replace(/\?&/, "?");

  return {
    connectionString: cleaned,
    ssl: { rejectUnauthorized: false },
    max: 10,
  };
}
