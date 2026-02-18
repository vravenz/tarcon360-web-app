import { getPool } from "../../config/database"
const pool = getPool()

export interface SiteCheckCall {
  schedule_id?: number;
  site_id: number;
  scheduled_time: string;      // 'HH:MM:SS'
  is_deleted?: boolean;
}

export const insertCheckCall = async (
  site_id: number,
  scheduled_time: string
): Promise<SiteCheckCall> => {
  const { rows } = await pool.query(
    `INSERT INTO site_check_call_schedules (site_id, scheduled_time)
     VALUES ($1, $2)
     RETURNING *`,
    [site_id, scheduled_time]
  );
  return rows[0];
};

export const getCheckCallsBySite = async (
  site_id: number
): Promise<SiteCheckCall[]> => {
  const { rows } = await pool.query(
    `SELECT schedule_id, scheduled_time
       FROM site_check_call_schedules
      WHERE site_id = $1
        AND is_deleted = FALSE
      ORDER BY scheduled_time`,
    [site_id]
  );
  return rows;
};
