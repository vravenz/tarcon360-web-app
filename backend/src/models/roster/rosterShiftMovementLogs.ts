import pool from '../../config/database';

export type TelemetryInsert = {
  company_id: number;
  roster_shift_assignment_id: number;
  location_lat: number;
  location_long: number;
  accuracy_m?: number | null;
  speed_mps?: number | null;
  heading_deg?: number | null;
  altitude_m?: number | null;
  provider?: string | null;       // 'web_pwa' | 'gps' | 'network'
  battery_pct?: number | null;
  is_mock?: boolean | null;
};

export async function insertMovementLog(payload: TelemetryInsert) {
  const {
    company_id,
    roster_shift_assignment_id,
    location_lat,
    location_long,
    accuracy_m = null,
    speed_mps = null,
    heading_deg = null,
    altitude_m = null,
    provider = null,
    battery_pct = null,
    is_mock = false,
  } = payload;

  const sql = `
    INSERT INTO public.roster_shift_movement_logs
      (company_id, roster_shift_assignment_id, location_lat, location_long,
       accuracy_m, speed_mps, heading_deg, altitude_m, provider, battery_pct, is_mock)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING movement_log_id, company_id, roster_shift_assignment_id,
              location_lat, location_long, accuracy_m, speed_mps, heading_deg,
              altitude_m, provider, battery_pct, is_mock, recorded_at
  `;
  const values = [
    company_id,
    roster_shift_assignment_id,
    location_lat,
    location_long,
    accuracy_m,
    speed_mps,
    heading_deg,
    altitude_m,
    provider,
    battery_pct,
    is_mock,
  ];
  const { rows } = await pool.query(sql, values);
  return rows[0];
}

export async function getLatestMovementByAssignment(assignmentId: number) {
  const sql = `
    SELECT movement_log_id, company_id, roster_shift_assignment_id,
           location_lat, location_long, accuracy_m, speed_mps, heading_deg,
           altitude_m, provider, battery_pct, is_mock, recorded_at
    FROM public.roster_shift_movement_logs
    WHERE roster_shift_assignment_id = $1
    ORDER BY recorded_at DESC
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [assignmentId]);
  return rows[0] ?? null;
}

export async function getTrailByAssignment(
  assignmentId: number,
  sinceIso?: string,
  limit = 200
) {
  const clauses: string[] = ['roster_shift_assignment_id = $1'];
  const params: any[] = [assignmentId];

  if (sinceIso) {
    clauses.push('recorded_at >= $2');
    params.push(sinceIso);
  }

  const sql = `
    SELECT movement_log_id, company_id, roster_shift_assignment_id,
           location_lat, location_long, accuracy_m, speed_mps, heading_deg,
           altitude_m, provider, battery_pct, is_mock, recorded_at
    FROM public.roster_shift_movement_logs
    WHERE ${clauses.join(' AND ')}
    ORDER BY recorded_at DESC
    LIMIT ${Number.isFinite(limit) ? limit : 200}
  `;
  const { rows } = await pool.query(sql, params);
  return rows;
}
