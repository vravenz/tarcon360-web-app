import { Router, Request, Response } from "express"
import { getPool } from "../../config/database"
const pool = getPool()

const router = Router()

const DEFAULT_TZ = process.env.COMPANY_TZ || "Asia/Karachi"

// ------------------------------
// helpers
// ------------------------------
function toNum(v: any): number | null {
  const n = typeof v === "string" ? Number(v) : v
  return Number.isFinite(n) ? n : null
}

async function assignmentExists(companyId: number, assignmentId: number): Promise<boolean> {
  const { rows } = await pool.query(
    `
    SELECT 1
    FROM public.roster_shift_assignments
    WHERE company_id = $1 AND roster_shift_assignment_id = $2
    LIMIT 1
    `,
    [companyId, assignmentId]
  )
  return rows.length > 0
}

async function getAssignmentBookState(companyId: number, assignmentId: number) {
  const { rows } = await pool.query(
    `
    SELECT roster_shift_assignment_id, company_id, book_on_at, book_off_at
    FROM public.roster_shift_assignments
    WHERE roster_shift_assignment_id = $1 AND company_id = $2
    LIMIT 1
    `,
    [assignmentId, companyId]
  )
  return rows[0] ?? null
}

/**
 * Mark calls as missed when they are beyond window end (+5 minutes)
 * and still upcoming.
 */
async function markMissedCheckCalls(assignmentId: number, tz: string) {
  await pool.query(
    `
    UPDATE public.roster_shift_check_calls c
    SET status = 'missed',
        updated_at = now()
    WHERE c.roster_shift_assignment_id = $1
      AND c.status = 'upcoming'
      AND now() > (
        ((c.scheduled_date::timestamp + c.scheduled_time) AT TIME ZONE $2)
        + interval '5 minutes'
      )
    `,
    [assignmentId, tz]
  )
}

// ------------------------------
// routes
// ------------------------------

/**
 * ✅ GET /api/mobile/check-calls?assignmentId=123&companyId=1
 *
 * Behavior:
 * - If NOT booked on yet -> returns calls: []
 * - Auto marks missed calls in DB
 * - Returns each call with:
 *   - ui_status: upcoming | due | completed | missed
 *   - can_press: boolean (only within 5min before/after and status=upcoming)
 *   - window_start_utc, window_end_utc, scheduled_ts_utc
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const assignmentId = Number(req.query.assignmentId)
    const companyId = Number(req.query.companyId)

    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      res.status(400).json({ ok: false, error: "Invalid assignmentId" })
      return
    }
    if (!Number.isFinite(companyId) || companyId <= 0) {
      res.status(400).json({ ok: false, error: "Invalid companyId" })
      return
    }

    const assignment = await getAssignmentBookState(companyId, assignmentId)
    if (!assignment) {
      res.status(404).json({ ok: false, error: "Assignment not found" })
      return
    }

    // ✅ only after book on
    if (!assignment.book_on_at) {
      res.json({ ok: true, data: { book_on_at: null, calls: [] } })
      return
    }

    // keep DB consistent
    await markMissedCheckCalls(assignmentId, DEFAULT_TZ)

    const { rows } = await pool.query(
      `
      SELECT
        c.check_call_id,
        c.roster_shift_assignment_id,
        c.scheduled_date::text AS scheduled_date,
        c.scheduled_time::text AS scheduled_time,
        c.actual_time,
        c.status,
        c.actual_latitude,
        c.actual_longitude,

        -- scheduled timestamp in UTC (based on tz)
        ((c.scheduled_date::timestamp + c.scheduled_time) AT TIME ZONE $2) AS scheduled_ts_utc,

        -- window bounds
        (((c.scheduled_date::timestamp + c.scheduled_time) AT TIME ZONE $2) - interval '5 minutes') AS window_start_utc,
        (((c.scheduled_date::timestamp + c.scheduled_time) AT TIME ZONE $2) + interval '5 minutes') AS window_end_utc,

        -- can press only if upcoming AND within the window
        (
          c.status = 'upcoming'
          AND now() >= (((c.scheduled_date::timestamp + c.scheduled_time) AT TIME ZONE $2) - interval '5 minutes')
          AND now() <= (((c.scheduled_date::timestamp + c.scheduled_time) AT TIME ZONE $2) + interval '5 minutes')
        ) AS can_press,

        -- derived ui status
        CASE
          WHEN c.status = 'completed' OR c.actual_time IS NOT NULL THEN 'completed'
          WHEN c.status = 'missed' THEN 'missed'
          WHEN now() > (((c.scheduled_date::timestamp + c.scheduled_time) AT TIME ZONE $2) + interval '5 minutes') THEN 'missed'
          WHEN now() >= (((c.scheduled_date::timestamp + c.scheduled_time) AT TIME ZONE $2) - interval '5 minutes')
           AND now() <= (((c.scheduled_date::timestamp + c.scheduled_time) AT TIME ZONE $2) + interval '5 minutes') THEN 'due'
          ELSE 'upcoming'
        END AS ui_status
      FROM public.roster_shift_check_calls c
      WHERE c.roster_shift_assignment_id = $1
      ORDER BY c.scheduled_date ASC, c.scheduled_time ASC
      `,
      [assignmentId, DEFAULT_TZ]
    )

    res.json({
      ok: true,
      data: {
        book_on_at: assignment.book_on_at,
        calls: rows,
      },
    })
  } catch (err: any) {
    console.error("check-calls GET error:", err)
    res.status(500).json({ ok: false, error: "Internal server error" })
  }
})

/**
 * ✅ POST /api/mobile/check-calls/complete
 * Body:
 *  - companyId
 *  - assignmentId
 *  - checkCallId
 *  - actual_latitude (optional)
 *  - actual_longitude (optional)
 *
 * Enforces:
 *  - must be within window (5min before/after)
 *  - must still be upcoming
 *  - updates actual_time + status=completed + coords
 */
router.post("/complete", async (req: Request, res: Response) => {
  try {
    const b = req.body ?? {}

    const companyId = Number(b.companyId)
    const assignmentId = Number(b.assignmentId)
    const checkCallId = Number(b.checkCallId)

    const actual_latitude = toNum(b.actual_latitude)
    const actual_longitude = toNum(b.actual_longitude)

    if (!Number.isFinite(companyId) || companyId <= 0) {
      res.status(400).json({ ok: false, error: "Invalid companyId" })
      return
    }
    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      res.status(400).json({ ok: false, error: "Invalid assignmentId" })
      return
    }
    if (!Number.isFinite(checkCallId) || checkCallId <= 0) {
      res.status(400).json({ ok: false, error: "Invalid checkCallId" })
      return
    }

    const exists = await assignmentExists(companyId, assignmentId)
    if (!exists) {
      res.status(404).json({ ok: false, error: "Assignment not found for company" })
      return
    }

    // load check call and compute window
    const { rows } = await pool.query(
      `
      SELECT
        c.check_call_id,
        c.status,
        c.actual_time,
        (((c.scheduled_date::timestamp + c.scheduled_time) AT TIME ZONE $3) - interval '5 minutes') AS window_start_utc,
        (((c.scheduled_date::timestamp + c.scheduled_time) AT TIME ZONE $3) + interval '5 minutes') AS window_end_utc
      FROM public.roster_shift_check_calls c
      WHERE c.check_call_id = $1 AND c.roster_shift_assignment_id = $2
      LIMIT 1
      `,
      [checkCallId, assignmentId, DEFAULT_TZ]
    )

    const call = rows[0] ?? null
    if (!call) {
      res.status(404).json({ ok: false, error: "Check call not found for assignment" })
      return
    }

    // already completed
    if (call.status === "completed" || call.actual_time) {
      res.json({ ok: true, data: { status: "completed" } })
      return
    }

    const now = new Date()
    const ws = new Date(call.window_start_utc)
    const we = new Date(call.window_end_utc)
    const inWindow = now >= ws && now <= we

    if (!inWindow) {
      // if already past -> mark missed
      if (now > we) {
        await pool.query(
          `
          UPDATE public.roster_shift_check_calls
          SET status='missed', updated_at=now()
          WHERE check_call_id=$1 AND roster_shift_assignment_id=$2 AND status='upcoming'
          `,
          [checkCallId, assignmentId]
        )
      }

      res.status(409).json({
        ok: false,
        error: "Check call is not pressable outside the 10-minute window",
      })
      return
    }

    const done = await pool.query(
      `
      UPDATE public.roster_shift_check_calls
      SET
        actual_time = now(),
        status = 'completed',
        actual_latitude = COALESCE($3, actual_latitude),
        actual_longitude = COALESCE($4, actual_longitude),
        updated_at = now()
      WHERE check_call_id = $1
        AND roster_shift_assignment_id = $2
        AND status = 'upcoming'
      RETURNING check_call_id, status, actual_time, actual_latitude, actual_longitude
      `,
      [checkCallId, assignmentId, actual_latitude, actual_longitude]
    )

    res.json({ ok: true, data: done.rows[0] ?? null })
  } catch (err: any) {
    console.error("check-calls COMPLETE error:", err)
    res.status(500).json({ ok: false, error: "Internal server error" })
  }
})

export default router
