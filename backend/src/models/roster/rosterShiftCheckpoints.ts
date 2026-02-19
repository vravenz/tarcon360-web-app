import { getPool } from "../../config/database"
const pool = () => getPool()
/* =========================================================================
   Types
   ========================================================================= */
export interface RosterShiftCheckpoint {
  scan_id?: number;
  roster_employee_id: number;
  checkpoint_id: number;
  scheduled_date: string;              // YYYY-MM-DD
  scheduled_time: string | null;       // HH:MM:SS (may be NULL)
  status?: 'upcoming' | 'completed' | 'missed';
  actual_time?: string | null;

  // geo-fence snapshots
  site_latitude_snapshot?:  number | null;
  site_longitude_snapshot?: number | null;
  site_radius_snapshot?:    number | null;

  // device GPS on scan
  actual_latitude?:  number | null;
  actual_longitude?: number | null;

  created_at?: string;
  updated_at?: string;
}

/**
 * Seed **one** roster-shift-assignment with *all* the site’s checkpoints
 * across the inclusive date range.
 *
 * Requires a UNIQUE(roster_employee_id, checkpoint_id, scheduled_date).
 */
export const seedCheckpointsForAssignment = async (
  roster_employee_id: number,
  site_id: number,
  start_date: string,
  end_date: string
): Promise<void> => {
  const sql = `
    INSERT INTO public.checkpoint_scans (
      roster_employee_id,
      checkpoint_id,
      scheduled_date,
      scheduled_time,
      site_latitude_snapshot,
      site_longitude_snapshot,
      site_radius_snapshot,
      status
    )
    SELECT
      $1,
      cp.checkpoint_id,
      gs::date,
      cp.scheduled_check_time,
      s.site_latitude,
      s.site_longitude,
      s.site_radius,
      'upcoming'
    FROM generate_series($2::date, $3::date, '1 day') AS gs
    JOIN public.site_checkpoints cp
      ON cp.site_id = $4
    JOIN public.sites s
      ON s.site_id = cp.site_id
    WHERE cp.is_deleted = FALSE
    ON CONFLICT (roster_employee_id, checkpoint_id, scheduled_date)
      DO NOTHING;
  `;
  await pool().query(sql, [roster_employee_id, start_date, end_date, site_id]);
};

interface SeedPayload {
  roster_employee_id: number;
  site_id: number;
  start_date: string;
  end_date: string;
}

/**
 * Bulk version — all payloads inside one tx.
 */
export const seedCheckpointsForAssignments = async (
  payloads: SeedPayload[]
): Promise<void> => {
  if (!payloads.length) return;
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    for (const p of payloads) {
      await client.query(
        `
        INSERT INTO public.checkpoint_scans (
          roster_employee_id,
          checkpoint_id,
          scheduled_date,
          scheduled_time,
          site_latitude_snapshot,
          site_longitude_snapshot,
          site_radius_snapshot,
          status
        )
        SELECT
          $1,
          cp.checkpoint_id,
          gs::date,
          cp.scheduled_check_time,
          s.site_latitude,
          s.site_longitude,
          s.site_radius,
          'upcoming'
        FROM generate_series($2::date, $3::date, '1 day') AS gs
        JOIN public.site_checkpoints cp ON cp.site_id = $4
        JOIN public.sites s               ON s.site_id = cp.site_id
        WHERE cp.is_deleted = FALSE
        ON CONFLICT (roster_employee_id, checkpoint_id, scheduled_date)
          DO NOTHING;
        `,
        [p.roster_employee_id, p.start_date, p.end_date, p.site_id]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

/**
 * Fetch all scans for a given roster_employee_id
 */
export const getCheckpointsByAssignment = async (
  roster_employee_id: number
): Promise<RosterShiftCheckpoint[]> => {
  const { rows } = await pool().query(
    `
    SELECT *
      FROM public.checkpoint_scans
     WHERE roster_employee_id = $1
     ORDER BY scheduled_date, scheduled_time NULLS FIRST;
    `,
    [roster_employee_id]
  );
  return rows;
};

/**
 * Update one scan’s status/time/GPS.
 */
export const updateCheckpointStatus = async (
  scan_id: number,
  status: 'completed' | 'missed',
  actual_time: string | null = null,
  actual_latitude?: number | null,
  actual_longitude?: number | null
): Promise<void> => {
  const assignments = [
    'status = $2',
    'actual_time = COALESCE($3, actual_time)',
    actual_latitude != null  ? 'actual_latitude = $4'  : '',
    actual_longitude != null ? 'actual_longitude = $5' : '',
    'updated_at = NOW()'
  ].filter(Boolean).join(', ');
  const params = [scan_id, status, actual_time] as any[];
  if (actual_latitude  != null) params.push(actual_latitude);
  if (actual_longitude != null) params.push(actual_longitude);

  await pool().query(
    `UPDATE public.checkpoint_scans SET ${assignments} WHERE scan_id = $1;`,
    params
  );
};
