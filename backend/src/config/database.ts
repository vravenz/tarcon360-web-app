import { Pool } from "pg"

let pool: Pool | null = null

function buildConnectionString() {
  const url = process.env.DATABASE_URL
  if (url && url.trim()) return url.trim()

  const host = process.env.DB_HOST || "localhost"
  const port = process.env.DB_PORT || "5432"
  const user = process.env.DB_USER || "postgres"
  const password = process.env.DB_PASSWORD || ""
  const database = process.env.DB_DATABASE || "postgres"
  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`
}

export function getPool() {
  if (pool) return pool

  const connectionString = buildConnectionString()
  const isProd = process.env.NODE_ENV === "production"

  pool = new Pool({
    connectionString,
    ssl: isProd ? { rejectUnauthorized: false } : undefined,
    max: 1, // ✅ serverless friendly
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

  return pool
}
