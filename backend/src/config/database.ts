import { Pool } from "pg"

let pool: Pool | null = null

function buildConnectionString() {
  // 1) Prefer DATABASE_URL (works for Vercel + Supabase)
  const url = process.env.DATABASE_URL
  if (url && url.trim()) return url.trim()

  // 2) Fallback to DB_* (works for your local .env)
  const host = process.env.DB_HOST || "localhost"
  const port = process.env.DB_PORT || "5432"
  const user = process.env.DB_USER || "postgres"
  const password = process.env.DB_PASSWORD || ""
  const database = process.env.DB_DATABASE || "postgres"

  // encode password safely
  const encPass = encodeURIComponent(password)
  return `postgresql://${user}:${encPass}@${host}:${port}/${database}`
}

export function getPool() {
  if (pool) return pool

  const connectionString = buildConnectionString()
  if (!connectionString) throw new Error("Missing database configuration")

  // SSL only needed in prod (Supabase/Vercel)
  const isProd = process.env.NODE_ENV === "production"

  pool = new Pool({
    connectionString,
    ssl: isProd ? { rejectUnauthorized: false } : undefined,
  })

  return pool
}
