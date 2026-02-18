// src/controllers/stats/staffStatsController.ts
import { RequestHandler } from 'express';
import pool from '../../config/database';

const parseDate = (s?: string) => (s ? new Date(s) : undefined);

/**
 * Resolve applicant_id to filter stats.
 * Priority:
 *  1) Explicit :staffId param (already an applicant_id)
 *  2) Logged-in user id from middleware (x-user-id) -> users.applicant_id
 */
async function resolveApplicantId(opts: {
  staffIdParam?: number | undefined;     // applicant_id if present in URL
  userIdFromHeader?: number | undefined; // users.id from middleware
  companyId?: number | undefined;
}): Promise<number | undefined> {
  const { staffIdParam, userIdFromHeader, companyId } = opts;

  if (staffIdParam && !Number.isNaN(staffIdParam)) return staffIdParam;

  if (userIdFromHeader && companyId) {
    const q = `SELECT applicant_id FROM users WHERE id=$1 AND company_id=$2 LIMIT 1`;
    const r = await pool.query(q, [userIdFromHeader, companyId]);
    const applicantId = r.rows[0]?.applicant_id as number | undefined;
    if (applicantId && !Number.isNaN(applicantId)) return applicantId;
  }
  return undefined;
}

/**
 * GET /api/stats/staff/me?companyId=123&from=YYYY-MM-DD&to=YYYY-MM-DD
 * GET /api/stats/staff/:staffId?companyId=123&from=YYYY-MM-DD&to=YYYY-MM-DD
 * - staffId = applicant_id (NOT users.id)
 */
export const staffStats: RequestHandler = async (req, res) => {
  try {
    const companyId = Number(req.query.companyId);
    const staffIdParam = req.params.staffId ? Number(req.params.staffId) : undefined; // applicant_id if provided
    const userIdFromHeader = (req as any).userId ? Number((req as any).userId) : undefined; // users.id

    const applicantId = await resolveApplicantId({
      staffIdParam,
      userIdFromHeader,
      companyId,
    });

    if (!companyId || !applicantId) {
      res.status(400).json({ ok: false, error: 'companyId and staff (applicant_id) are required' });
      return;
    }

    const from = parseDate(String(req.query.from || ''));
    const to = parseDate(String(req.query.to || ''));
    const dateFrom = from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = to ?? new Date();

    // a.company_id = $1 AND re.applicant_id = $2 AND s.shift_date BETWEEN $3 AND $4
    const params = [companyId, applicantId, dateFrom, dateTo];

    const q = {
      assigned: `
        SELECT COUNT(*)::int AS assigned
        FROM roster_shift_assignments a
        JOIN roster_shifts s ON s.roster_shift_id = a.roster_shift_id
        JOIN roster_employees re ON re.roster_employee_id = a.roster_employee_id
        WHERE a.company_id = $1
          AND re.applicant_id = $2
          AND s.shift_date >= $3::date AND s.shift_date <= $4::date
          AND a.assignment_status IN ('active','completed')
      `,
      bookOnOff: `
        SELECT
          SUM(CASE WHEN a.book_on_at  IS NOT NULL THEN 1 ELSE 0 END)::int AS with_book_on,
          SUM(CASE WHEN a.book_off_at IS NOT NULL THEN 1 ELSE 0 END)::int AS with_book_off,
          SUM(CASE
            WHEN a.book_on_at IS NOT NULL
             AND s.scheduled_start_time IS NOT NULL
             AND a.book_on_at <= (s.shift_date::timestamp + s.scheduled_start_time::time) + interval '5 min'
            THEN 1 ELSE 0 END
          )::int AS on_time_book_on
        FROM roster_shift_assignments a
        JOIN roster_shifts s ON s.roster_shift_id = a.roster_shift_id
        JOIN roster_employees re ON re.roster_employee_id = a.roster_employee_id
        WHERE a.company_id = $1
          AND re.applicant_id = $2
          AND s.shift_date >= $3::date AND s.shift_date <= $4::date
          AND a.assignment_status IN ('active','completed')
      `,
      avgEta: `
        SELECT AVG(a.eta)::float AS avg_eta_minutes
        FROM roster_shift_assignments a
        JOIN roster_shifts s ON s.roster_shift_id = a.roster_shift_id
        JOIN roster_employees re ON re.roster_employee_id = a.roster_employee_id
        WHERE a.company_id = $1
          AND re.applicant_id = $2
          AND s.shift_date >= $3::date AND s.shift_date <= $4::date
          AND a.eta IS NOT NULL
      `,
      todayCounts: `
        SELECT
          SUM(CASE WHEN a.assignment_status='active' THEN 1 ELSE 0 END)::int AS active,
          SUM(CASE WHEN a.assignment_status='completed' THEN 1 ELSE 0 END)::int AS completed,
          SUM(CASE WHEN a.assignment_status='active' AND a.employee_shift_status='unconfirmed' THEN 1 ELSE 0 END)::int AS pending
        FROM roster_shift_assignments a
        JOIN roster_shifts s ON s.roster_shift_id = a.roster_shift_id
        JOIN roster_employees re ON re.roster_employee_id = a.roster_employee_id
        WHERE a.company_id = $1
          AND re.applicant_id = $2
          AND s.shift_date = CURRENT_DATE
      `,
      checkpointCompliance: `
        SELECT
          COUNT(*) FILTER (WHERE status='done')::int AS done,
          COUNT(*)::int AS total
        FROM checkpoint_scans cs
        JOIN roster_employees re ON re.roster_employee_id = cs.roster_employee_id
        WHERE re.company_id = $1
          AND re.applicant_id = $2
          AND cs.scheduled_date >= $3::date AND cs.scheduled_date <= $4::date
      `,
      checkCallCompliance: `
        SELECT
          COUNT(*) FILTER (WHERE cc.status='done')::int AS done,
          COUNT(*)::int AS total
        FROM roster_shift_check_calls cc
        JOIN roster_shift_assignments a ON a.roster_shift_assignment_id = cc.roster_shift_assignment_id
        JOIN roster_shifts s ON s.roster_shift_id = a.roster_shift_id
        JOIN roster_employees re ON re.roster_employee_id = a.roster_employee_id
        WHERE a.company_id = $1
          AND re.applicant_id = $2
          AND s.shift_date >= $3::date AND s.shift_date <= $4::date
      `,
      hoursWorked: `
        SELECT
          SUM(
            EXTRACT(EPOCH FROM (
              COALESCE(a.book_off_at, s.shift_date::timestamp + s.scheduled_end_time::time)
              - COALESCE(a.book_on_at,  s.shift_date::timestamp + s.scheduled_start_time::time)
            )) / 3600.0
          ) AS hours
        FROM roster_shift_assignments a
        JOIN roster_shifts s ON s.roster_shift_id = a.roster_shift_id
        JOIN roster_employees re ON re.roster_employee_id = a.roster_employee_id
        WHERE a.company_id = $1
          AND re.applicant_id = $2
          AND s.shift_date >= $3::date AND s.shift_date <= $4::date
          AND a.assignment_status IN ('active','completed')
      `,
      latestTelem: `
        SELECT m.location_lat, m.location_long, m.accuracy_m, m.recorded_at
        FROM roster_shift_movement_logs m
        WHERE m.roster_shift_assignment_id IN (
          SELECT a.roster_shift_assignment_id
          FROM roster_shift_assignments a
          JOIN roster_employees re ON re.roster_employee_id = a.roster_employee_id
          WHERE a.company_id = $1 AND re.applicant_id = $2
          ORDER BY a.roster_shift_assignment_id DESC
          LIMIT 100
        )
        ORDER BY m.recorded_at DESC
        LIMIT 1
      `,
      sitesServed: `
        SELECT s2.site_id, s2.site_name, COUNT(*)::int AS cnt
        FROM roster_shift_assignments a
        JOIN roster_shifts s ON s.roster_shift_id = a.roster_shift_id
        JOIN roster r ON r.roster_id = s.roster_id
        JOIN sites s2 ON s2.site_id = r.site_id
        JOIN roster_employees re ON re.roster_employee_id = a.roster_employee_id
        WHERE a.company_id = $1
          AND re.applicant_id = $2
          AND s.shift_date >= $3::date AND s.shift_date <= $4::date
        GROUP BY s2.site_id, s2.site_name
        ORDER BY cnt DESC
        LIMIT 3
      `,
      recent5: `
        SELECT
          a.roster_shift_assignment_id AS id,
          s2.site_name,
          s.shift_date,
          s.scheduled_start_time,
          s.scheduled_end_time,
          a.assignment_status,
          a.employee_shift_status
        FROM roster_shift_assignments a
        JOIN roster_shifts s ON s.roster_shift_id = a.roster_shift_id
        JOIN roster r ON r.roster_id = s.roster_id
        JOIN sites s2 ON s2.site_id = r.site_id
        JOIN roster_employees re ON re.roster_employee_id = a.roster_employee_id
        WHERE a.company_id = $1
          AND re.applicant_id = $2
        ORDER BY s.shift_date DESC, s.scheduled_start_time DESC NULLS LAST
        LIMIT 5
      `,
    };

    const [assigned, book, eta, today, cp, cc, hours, telem, sites, recent] = await Promise.all([
      pool.query(q.assigned, params),
      pool.query(q.bookOnOff, params),
      pool.query(q.avgEta, params),
      pool.query(q.todayCounts, [companyId, applicantId]),
      pool.query(q.checkpointCompliance, params),
      pool.query(q.checkCallCompliance, params),
      pool.query(q.hoursWorked, params),
      pool.query(q.latestTelem, [companyId, applicantId]),
      pool.query(q.sitesServed, params),
      pool.query(q.recent5, [companyId, applicantId]),
    ]);

    const assignedCount = assigned.rows[0]?.assigned ?? 0;
    const withOn  = book.rows[0]?.with_book_on  ?? 0;
    const withOff = book.rows[0]?.with_book_off ?? 0;
    const onTime  = book.rows[0]?.on_time_book_on ?? 0;

    res.json({
      ok: true,
      range: { from: dateFrom.toISOString(), to: dateTo.toISOString() },
      kpis: {
        assigned: assignedCount,
        attendanceRate: assignedCount ? Math.round((withOn / assignedCount) * 100) : 0,
        onTimeRate:     withOn ? Math.round((onTime / withOn) * 100) : 0,
        bookOffRate:    withOn ? Math.round((withOff / withOn) * 100) : 0,
        avgEtaMin:      eta.rows[0]?.avg_eta_minutes ?? null,
        today:          today.rows[0] ?? { active: 0, completed: 0, pending: 0 },
        hoursWorked:    Number(hours.rows[0]?.hours ?? 0),
        checkpointCompliance: {
          done:  cp.rows[0]?.done ?? 0,
          total: cp.rows[0]?.total ?? 0,
          rate:  (cp.rows[0]?.total ?? 0) ? Math.round(((cp.rows[0]?.done ?? 0) / (cp.rows[0]?.total ?? 0)) * 100) : 0
        },
        checkCallCompliance: {
          done:  cc.rows[0]?.done ?? 0,
          total: cc.rows[0]?.total ?? 0,
          rate:  (cc.rows[0]?.total ?? 0) ? Math.round(((cc.rows[0]?.done ?? 0) / (cc.rows[0]?.total ?? 0)) * 100) : 0
        },
      },
      latestTelemetry: telem.rows[0] ?? null,
      topSites: sites.rows ?? [],
      recentShifts: recent.rows ?? [],
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ ok: false, error: e?.message || 'Failed to load stats' });
  }
};
