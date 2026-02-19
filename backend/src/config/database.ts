// backend/src/config/database.ts
// backend/src/config/database.ts
import { Pool, type QueryConfig, type QueryResult } from "pg";

let _pool: Pool | null = null;

function buildConnectionString() {
  // Prefer Vercel/Supabase env
  const url = process.env.DATABASE_URL;
  if (url && url.trim()) return url.trim();

  // Local fallback (optional)
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const user = process.env.DB_USER || "postgres";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_DATABASE || "postgres";

  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function getPool() {
  if (_pool) return _pool;

  const connectionString = buildConnectionString();

  // IMPORTANT: Don't throw at import-time. Only throw when actually used.
  if (!connectionString) {
    throw new Error("Missing DB config: set DATABASE_URL (Vercel) or DB_* (local)");
  }

  const isProd = process.env.NODE_ENV === "production";

  _pool = new Pool({
    connectionString,
    ssl: isProd ? { rejectUnauthorized: false } : undefined,
  });

  return _pool;
}

// ✅ Proxy object so existing code `pool.query(...)` keeps working everywhere
const db = {
  query: (text: string | QueryConfig<any[]>, params?: any[]) =>
    getPool().query(text as any, params as any) as Promise<QueryResult<any>>,
  connect: () => getPool().connect(),
};

export default db;
