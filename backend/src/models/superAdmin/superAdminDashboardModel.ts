// src/models/superAdmin/superAdminDashboardModel.ts
import pool from "../../config/database";

export type SuperAdminDashboardSummary = {
  core: {
    companies: number;
    users: number;
    clients: number;
    sites: number;
    guardGroups: number;
  };
  roster: {
    rosters: number;
    shifts: number;
    shiftsToday: number;
  };
  compliance: {
    checkpointsScheduledToday: number;
    checkpointsCompletedToday: number;
    checkpointsMissedToday: number;

    checkCallsScheduledToday: number;
    checkCallsCompletedToday: number;
    checkCallsMissedToday: number;
  };
  recruitment: {
    jobs: number;
    applications: number;
  };
  finance: {
    invoices: number;
    invoicesIssuedThisMonth: number;
    overdueInvoices: number;
    paymentsThisMonth: number; // sum(amount)
    revenueThisMonth: number;  // sum(invoices.total)
    creditNotesThisMonth: number;
  };
};

function toInt(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toMoney(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

/**
 * Clean Super Admin dashboard summary
 * Note: "Employees" are not a dedicated table in your dump; user/staff are in `users`.
 * If you later add a true employee table, we can swap the metric.
 */
export const getDashboardSummary = async (): Promise<SuperAdminDashboardSummary> => {
  const sql = `
    WITH
      month_start AS (SELECT date_trunc('month', CURRENT_DATE)::date AS d),
      today AS (SELECT CURRENT_DATE::date AS d)

    SELECT
      -- Core
      (SELECT COUNT(*) FROM companies)::int AS companies,
      (SELECT COUNT(*) FROM users)::int AS users,
      (SELECT COUNT(*) FROM clients)::int AS clients,
      (SELECT COUNT(*) FROM sites)::int AS sites,
      (SELECT COUNT(*) FROM guard_groups)::int AS guard_groups,

      -- Roster
      (SELECT COUNT(*) FROM roster)::int AS rosters,
      (SELECT COUNT(*) FROM roster_shifts)::int AS shifts,
      (SELECT COUNT(*) FROM roster_shifts rs WHERE rs.shift_date = (SELECT d FROM today))::int AS shifts_today,

      -- Checkpoint compliance (today)
      (SELECT COUNT(*) FROM checkpoint_scans cs WHERE cs.scheduled_date = (SELECT d FROM today))::int AS checkpoints_scheduled_today,
      (SELECT COUNT(*) FROM checkpoint_scans cs
        WHERE cs.scheduled_date = (SELECT d FROM today)
          AND lower(cs.status) IN ('completed','done','scanned')
      )::int AS checkpoints_completed_today,
      (SELECT COUNT(*) FROM checkpoint_scans cs
        WHERE cs.scheduled_date = (SELECT d FROM today)
          AND lower(cs.status) = 'missed'
      )::int AS checkpoints_missed_today,

      -- Check call compliance (today)
      (SELECT COUNT(*) FROM roster_shift_check_calls cc WHERE cc.scheduled_date = (SELECT d FROM today))::int AS check_calls_scheduled_today,
      (SELECT COUNT(*) FROM roster_shift_check_calls cc
        WHERE cc.scheduled_date = (SELECT d FROM today)
          AND lower(cc.status) IN ('completed','done','called')
      )::int AS check_calls_completed_today,
      (SELECT COUNT(*) FROM roster_shift_check_calls cc
        WHERE cc.scheduled_date = (SELECT d FROM today)
          AND lower(cc.status) = 'missed'
      )::int AS check_calls_missed_today,

      -- Recruitment
      (SELECT COUNT(*) FROM jobs)::int AS jobs,
      (SELECT COUNT(*) FROM applications)::int AS applications,

      -- Finance
      (SELECT COUNT(*) FROM invoices)::int AS invoices,
      (SELECT COUNT(*) FROM invoices i
        WHERE i.issue_date >= (SELECT d FROM month_start)
      )::int AS invoices_issued_this_month,
      (SELECT COUNT(*) FROM invoices i
        WHERE lower(i.status) = 'issued' AND i.due_date < (SELECT d FROM today)
      )::int AS overdue_invoices,
      COALESCE((
        SELECT SUM(p.amount) FROM payments p
        WHERE p.paid_on >= (SELECT d FROM month_start)
      ), 0)::numeric AS payments_this_month,
      COALESCE((
        SELECT SUM(i.total) FROM invoices i
        WHERE i.issue_date >= (SELECT d FROM month_start)
      ), 0)::numeric AS revenue_this_month,
      (SELECT COUNT(*) FROM credit_notes cn
        WHERE cn.issue_date >= (SELECT d FROM month_start)
      )::int AS credit_notes_this_month
  `;

  const { rows } = await pool.query(sql);
  const r = rows?.[0] ?? {};

  return {
    core: {
      companies: toInt(r.companies),
      users: toInt(r.users),
      clients: toInt(r.clients),
      sites: toInt(r.sites),
      guardGroups: toInt(r.guard_groups),
    },
    roster: {
      rosters: toInt(r.rosters),
      shifts: toInt(r.shifts),
      shiftsToday: toInt(r.shifts_today),
    },
    compliance: {
      checkpointsScheduledToday: toInt(r.checkpoints_scheduled_today),
      checkpointsCompletedToday: toInt(r.checkpoints_completed_today),
      checkpointsMissedToday: toInt(r.checkpoints_missed_today),

      checkCallsScheduledToday: toInt(r.check_calls_scheduled_today),
      checkCallsCompletedToday: toInt(r.check_calls_completed_today),
      checkCallsMissedToday: toInt(r.check_calls_missed_today),
    },
    recruitment: {
      jobs: toInt(r.jobs),
      applications: toInt(r.applications),
    },
    finance: {
      invoices: toInt(r.invoices),
      invoicesIssuedThisMonth: toInt(r.invoices_issued_this_month),
      overdueInvoices: toInt(r.overdue_invoices),
      paymentsThisMonth: toMoney(r.payments_this_month),
      revenueThisMonth: toMoney(r.revenue_this_month),
      creditNotesThisMonth: toInt(r.credit_notes_this_month),
    },
  };
};
