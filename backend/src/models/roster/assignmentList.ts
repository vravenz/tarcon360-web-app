// backend/src/models/roster/assignmentList.ts
import pool from '../../config/database';

export interface AssignmentListRow {
  roster_shift_assignment_id: number;
  assignment_status: 'active' | 'removed' | 'completed';
  employee_shift_status: 'confirmed' | 'unconfirmed';
  shift_date: string; // ISO date
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  site_name: string;
  roster_shift_id: number;
  roster_employee_id: number;
  applicant_first_name?: string | null;
  applicant_last_name?: string | null;
}

export type FindAssignmentsParams = {
  companyId: number;
  userId?: number;   // if provided, limits to that user's assignments
  dateFrom?: string; // 'YYYY-MM-DD'
  dateTo?: string;   // 'YYYY-MM-DD'
  limit?: number;    // default 50
  offset?: number;   // default 0
};

type UserContext = {
  applicant_id: number | null;
  effective_company_id: number | null;
  is_subcontractor_employee: boolean;
};

/** Resolve applicant_id and effective company for a user. */
async function resolveUserContext(userId: number | undefined): Promise<UserContext | null> {
  if (!userId) return null;

  const sql = `
    SELECT
      applicant_id,
      company_id,
      current_assigned_company_id,
      COALESCE(is_subcontractor_employee, false) AS is_subcontractor_employee
    FROM public.users
    WHERE id = $1
    LIMIT 1;
  `;
  const { rows } = await pool.query(sql, [userId]);
  if (!rows.length) return null;

  const u = rows[0];
  const effective_company_id = u.is_subcontractor_employee ? u.current_assigned_company_id : u.company_id;

  return {
    applicant_id: u.applicant_id ?? null,
    effective_company_id: effective_company_id ?? null,
    is_subcontractor_employee: !!u.is_subcontractor_employee,
  };
}

/**
 * List assignments for a company, optionally scoped to a user (via applicant_id).
 * If userId is provided:
 *   - Validate user's effective company matches companyId
 *   - Filter assignments by that user's applicant_id via roster_employees
 */
export const findAssignmentsForUser = async (params: FindAssignmentsParams): Promise<AssignmentListRow[]> => {
  const { companyId, userId, dateFrom, dateTo, limit = 50, offset = 0 } = params;

  let applicantId: number | null = null;

  if (userId) {
    const ctx = await resolveUserContext(userId);
    // If user missing or company mismatch, return empty safely
    if (!ctx || Number(ctx.effective_company_id) !== Number(companyId)) return [];
    applicantId = ctx.applicant_id;
    if (!applicantId) return []; // user without applicant link has no assignments
  }

  const values: any[] = [companyId];
  let i = 2;
  const where: string[] = [`r.company_id = $1`];

  if (applicantId) {
    where.push(`re.applicant_id = $${i}`); values.push(applicantId); i++;
  }
  if (dateFrom) {
    where.push(`rs.shift_date >= $${i}`); values.push(dateFrom); i++;
  }
  if (dateTo) {
    where.push(`rs.shift_date <= $${i}`); values.push(dateTo); i++;
  }

  values.push(limit);  const limIdx = i++;
  values.push(offset); const offIdx = i++;

  const sql = `
    SELECT
      rsa.roster_shift_assignment_id,
      rsa.assignment_status,
      rsa.employee_shift_status,
      rs.shift_date::text AS shift_date,
      rs.scheduled_start_time::text AS scheduled_start_time,
      rs.scheduled_end_time::text   AS scheduled_end_time,
      s.site_name,
      rs.roster_shift_id,
      rsa.roster_employee_id,
      a.first_name   AS applicant_first_name,
      a.last_name    AS applicant_last_name
    FROM public.roster_shift_assignments rsa
    JOIN public.roster_employees re ON re.roster_employee_id = rsa.roster_employee_id
    JOIN public.roster_shifts rs     ON rs.roster_shift_id = rsa.roster_shift_id
    JOIN public.roster r             ON r.roster_id = rs.roster_id
    JOIN public.sites s              ON s.site_id = r.site_id
    JOIN public.applicants a         ON a.applicant_id = re.applicant_id
    WHERE ${where.join(' AND ')}
    ORDER BY rs.shift_date DESC, rs.scheduled_start_time NULLS LAST, rsa.roster_shift_assignment_id DESC
    LIMIT $${limIdx} OFFSET $${offIdx};
  `;

  const { rows } = await pool.query(sql, values);
  return rows;
};

/** Count total rows for the same filters (no limit/offset). */
export const countAssignmentsForUser = async (
  params: Omit<FindAssignmentsParams, 'limit' | 'offset'>
): Promise<number> => {
  const { companyId, userId, dateFrom, dateTo } = params;

  let applicantId: number | null = null;

  if (userId) {
    const ctx = await resolveUserContext(userId);
    if (!ctx || Number(ctx.effective_company_id) !== Number(companyId)) return 0;
    applicantId = ctx.applicant_id;
    if (!applicantId) return 0;
  }

  const values: any[] = [companyId];
  let i = 2;
  const where: string[] = [`r.company_id = $1`];

  if (applicantId) {
    where.push(`re.applicant_id = $${i}`); values.push(applicantId); i++;
  }
  if (dateFrom) {
    where.push(`rs.shift_date >= $${i}`); values.push(dateFrom); i++;
  }
  if (dateTo) {
    where.push(`rs.shift_date <= $${i}`); values.push(dateTo); i++;
  }

  const sql = `
    SELECT COUNT(*)::int AS total
    FROM public.roster_shift_assignments rsa
    JOIN public.roster_employees re ON re.roster_employee_id = rsa.roster_employee_id
    JOIN public.roster_shifts rs     ON rs.roster_shift_id = rsa.roster_shift_id
    JOIN public.roster r             ON r.roster_id = rs.roster_id
    JOIN public.applicants a         ON a.applicant_id = re.applicant_id
    WHERE ${where.join(' AND ')};
  `;

  const { rows } = await pool.query(sql, values);
  return rows[0]?.total ?? 0;
};
