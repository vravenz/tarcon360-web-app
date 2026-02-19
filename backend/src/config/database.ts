// backend/src/config/database.ts
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:admin3223@localhost:5432/tarcon360-db";

const isProd = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString,
  ssl: isProd ? { rejectUnauthorized: false } : undefined,
});

export default pool;
