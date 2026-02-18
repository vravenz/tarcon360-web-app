import { Pool } from "pg"

let pool: Pool | null = null

export function getPool() {
  if (pool) return pool

  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL || process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable")
  }

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  return pool
}
