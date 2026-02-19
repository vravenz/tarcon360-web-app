// backend/src/config/database.ts
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || "postgres"}:${encodeURIComponent(
    process.env.DB_PASSWORD || ""
  )}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${
    process.env.DB_DATABASE || "postgres"
  }`;

const isProd = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString,
  ssl: isProd ? { rejectUnauthorized: false } : undefined,
});

export default pool;
