import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:admin3223@localhost/tarcon360-db"
});

export default pool;
