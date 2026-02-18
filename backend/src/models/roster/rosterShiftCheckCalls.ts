import { getPool } from "../../config/database"
const pool = getPool()

/* =========================================================================
   Types
   ========================================================================= */
export interface RosterShiftCheckCall {
  check_call_id?: number;
  roster_shift_assignment_id: number;
  scheduled_date: string;           // YYYY-MM-DD
  scheduled_time: string;           // HH:MM:SS
  status?: 'upcoming' | 'completed' | 'missed';
  actual_time?: string | null;

  // ● snapshot of site at seed-time
  site_latitude_snapshot?: number | null;
  site_longitude_snapshot?: number | null;
  site_radius_snapshot?: number | null;

  // ● when user checks in
  actual_latitude?: number | null;
  actual_longitude?: number | null;

  created_at?: string;
  updated_at?: string;
}

/* =========================================================================
   Seed helpers
   ========================================================================= */

/**
 * Seed **one** assignment with the site’s daily check-call times
 * across the inclusive date-range, capturing site snapshot.
 */
export const seedCheckCallsForAssignment = async (
  roster_shift_assignment_id: number,
  site_id: number,
  start_date: string,
  end_date: string
): Promise<void> => {
  const sql = `
    INSERT INTO public.roster_shift_check_calls (
      roster_shift_assignment_id,
      scheduled_date,
      scheduled_time,
      site_latitude_snapshot,
      site_longitude_snapshot,
      site_radius_snapshot
    )
    SELECT
      $1,
      gs::date,
      scs.scheduled_time,
      s.site_latitude,
      s.site_longitude,
      s.site_radius
    FROM generate_series($2::date, $3::date, '1 day') AS gs
    JOIN public.site_check_call_schedules scs
      ON scs.site_id = $4
    JOIN public.sites s
      ON s.site_id = scs.site_id
    WHERE scs.is_deleted = FALSE
    ON CONFLICT (roster_shift_assignment_id, scheduled_date, scheduled_time)
      DO NOTHING;
  `;
  await pool.query(sql, [
    roster_shift_assignment_id,
    start_date,
    end_date,
    site_id
  ]);
};

/**
 * Bulk version — all payloads executed in one transaction.
 */
interface SeedPayload {
  assignment_id: number;
  site_id: number;
  start_date: string;
  end_date: string;
}

export const seedCheckCallsForAssignments = async (
  payloads: SeedPayload[]
): Promise<void> => {
  if (!payloads.length) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const p of payloads) {
      await client.query(
        `
        INSERT INTO public.roster_shift_check_calls (
          roster_shift_assignment_id,
          scheduled_date,
          scheduled_time,
          site_latitude_snapshot,
          site_longitude_snapshot,
          site_radius_snapshot
        )
        SELECT
          $1,
          gs::date,
          scs.scheduled_time,
          s.site_latitude,
          s.site_longitude,
          s.site_radius
        FROM generate_series($2::date, $3::date, '1 day') AS gs
        JOIN public.site_check_call_schedules scs
          ON scs.site_id = $4
        JOIN public.sites s
          ON s.site_id = scs.site_id
        WHERE scs.is_deleted = FALSE
        ON CONFLICT (roster_shift_assignment_id, scheduled_date, scheduled_time)
          DO NOTHING;
        `,
        [p.assignment_id, p.start_date, p.end_date, p.site_id]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/* =========================================================================
   Fetch & Update helpers
   ========================================================================= */

export const getCheckCallsByAssignment = async (
  roster_shift_assignment_id: number
): Promise<RosterShiftCheckCall[]> => {
  const { rows } = await pool.query(
    `
    SELECT *
      FROM public.roster_shift_check_calls
     WHERE roster_shift_assignment_id = $1
     ORDER BY scheduled_date, scheduled_time;
    `,
    [roster_shift_assignment_id]
  );
  return rows;
};

export const updateCheckCallStatus = async (
  check_call_id: number,
  status: 'completed' | 'missed',
  actual_time: string | null = null,
  actual_latitude?: number | null,
  actual_longitude?: number | null
): Promise<void> => {
  const fields = [
    'status = $2',
    'actual_time = COALESCE($3, actual_time)',
    actual_latitude  != null ? 'actual_latitude = $4' : '',
    actual_longitude != null ? 'actual_longitude = $5' : '',
    'updated_at = NOW()'
  ].filter(Boolean).join(', ');

  const params = [check_call_id, status, actual_time];
  if (actual_latitude  != null) params.push(actual_latitude);
  if (actual_longitude != null) params.push(actual_longitude);

  await pool.query(
    `UPDATE public.roster_shift_check_calls SET ${fields}
     WHERE check_call_id = $1;`,
    params
  );
};
