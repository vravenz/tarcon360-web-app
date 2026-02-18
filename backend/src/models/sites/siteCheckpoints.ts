import { getPool } from "../../config/database"
const pool = getPool()

export interface SiteCheckpoint {
  checkpoint_id?: number;            // serial PK
  site_id: number;                   // FK → sites.site_id
  checkpoint_number: number;         // e.g. 1, 2, 3...
  checkpoint_name?: string | null;   // e.g. "Main Entrance"
  scheduled_check_time?: string | null; // e.g. "10:00:00"
  qr_token: string;                  // UUID
  is_deleted: boolean;               // soft-delete flag
  created_at: string;                // timestamps
  updated_at: string;
}

// Insert a new checkpoint (ignores any deleted rows)
export const insertCheckpoint = async (
  cp: Pick<SiteCheckpoint, 'site_id' | 'checkpoint_number' | 'checkpoint_name' | 'scheduled_check_time'>
): Promise<SiteCheckpoint> => {
  const { site_id, checkpoint_number, checkpoint_name, scheduled_check_time } = cp;
  const query = `
    INSERT INTO site_checkpoints (
      site_id,
      checkpoint_number,
      checkpoint_name,
      scheduled_check_time
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      checkpoint_id,
      site_id,
      checkpoint_number,
      checkpoint_name,
      scheduled_check_time,
      qr_token,
      is_deleted,
      created_at,
      updated_at;
  `;
  const values = [
    site_id,
    checkpoint_number,
    checkpoint_name,
    scheduled_check_time
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Fetch all non-deleted checkpoints for a site
export const getCheckpointsBySite = async (
  siteId: number
): Promise<SiteCheckpoint[]> => {
  const query = `
    SELECT
      checkpoint_id,
      site_id,
      checkpoint_number,
      checkpoint_name,
      scheduled_check_time,
      qr_token,
      is_deleted,
      created_at,
      updated_at
    FROM site_checkpoints
    WHERE site_id = $1
      AND is_deleted = FALSE
    ORDER BY checkpoint_number;
  `;
  const result = await pool.query(query, [siteId]);
  return result.rows;
};
