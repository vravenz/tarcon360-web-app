import { Router, Request, Response } from "express"
import pool from "../../config/database"

const router = Router()

/** Build UTC timestamp from shift_date + scheduled_start_time (which is time w/o tz). */
function toUtcStartTs(shift_date: string, scheduled_start_time: string | null): Date {
  const t = scheduled_start_time ?? "00:00:00"
  return new Date(`${shift_date}T${t}Z`)
}

type ReminderType = "shift_created" | "24h" | "2h"
type ReminderResponse = "accept" | "decline"

function eventTypeFor(type: ReminderType, response: ReminderResponse) {
  if (type === "shift_created") return response === "accept" ? "reminder_shift_created_accept" : "reminder_shift_created_decline"
  if (type === "24h") return response === "accept" ? "reminder_24h_accept" : "reminder_24h_decline"
  return response === "accept" ? "reminder_2h_accept" : "reminder_2h_decline"
}

async function fetchAssignmentWindow(assignmentId: number) {
  const { rows } = await pool.query(
    `
    SELECT
      assignment_id,
      company_id,
      roster_shift_id,
      roster_employee_id,
      shift_date::text AS shift_date,
      scheduled_start_time::text AS scheduled_start_time,
      start_ts_utc,
      end_ts_utc,
      book_on_at,
      book_off_at
    FROM public.v_shift_assignment_status
    WHERE assignment_id = $1
    LIMIT 1
    `,
    [assignmentId]
  )
  return rows[0] ?? null
}

async function getReminderState(assignmentId: number, companyId: number) {
  const { rows } = await pool.query(
    `
    SELECT
      bool_or(event_type IN ('reminder_shift_created_accept','reminder_shift_created_decline')) AS has_shift_created,
      bool_or(event_type IN ('reminder_24h_accept','reminder_24h_decline'))               AS has_24h,
      bool_or(event_type IN ('reminder_2h_accept','reminder_2h_decline'))                 AS has_2h,
      max(event_time) FILTER (WHERE event_type IN ('reminder_shift_created_accept','reminder_shift_created_decline')) AS shift_created_at,
      max(event_time) FILTER (WHERE event_type IN ('reminder_24h_accept','reminder_24h_decline')) AS c24h_at,
      max(event_time) FILTER (WHERE event_type IN ('reminder_2h_accept','reminder_2h_decline')) AS c2h_at
    FROM public.roster_shift_time_logs
    WHERE roster_shift_assignment_id = $1 AND company_id = $2
    `,
    [assignmentId, companyId]
  )

  return (
    rows[0] ?? {
      has_shift_created: false,
      has_24h: false,
      has_2h: false,
      shift_created_at: null,
      c24h_at: null,
      c2h_at: null,
    }
  )
}

/** ---------- helpers for telemetry ---------- */
function toNum(v: any): number | null {
  const n = typeof v === "string" ? Number(v) : v
  return Number.isFinite(n) ? n : null
}
function toBool(v: any): boolean | null {
  if (typeof v === "boolean") return v
  if (v === "true") return true
  if (v === "false") return false
  return null
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

async function insertMovementLog(payload: {
  company_id: number
  roster_shift_assignment_id: number
  location_lat: number
  location_long: number
  accuracy_m?: number | null
  speed_mps?: number | null
  heading_deg?: number | null
  altitude_m?: number | null
  provider?: string | null
  battery_pct?: number | null
  is_mock?: boolean
}) {
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
  } = payload

  const sql = `
    INSERT INTO public.roster_shift_movement_logs
      (company_id, roster_shift_assignment_id, location_lat, location_long,
       accuracy_m, speed_mps, heading_deg, altitude_m, provider, battery_pct, is_mock)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING movement_log_id, company_id, roster_shift_assignment_id,
              location_lat, location_long, accuracy_m, speed_mps, heading_deg,
              altitude_m, provider, battery_pct, is_mock, recorded_at
  `
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
  ]
  const { rows } = await pool.query(sql, values)
  return rows[0]
}

async function getLatestMovementByAssignment(assignmentId: number) {
  const sql = `
    SELECT movement_log_id, company_id, roster_shift_assignment_id,
           location_lat, location_long, accuracy_m, speed_mps, heading_deg,
           altitude_m, provider, battery_pct, is_mock, recorded_at
    FROM public.roster_shift_movement_logs
    WHERE roster_shift_assignment_id = $1
    ORDER BY recorded_at DESC
    LIMIT 1
  `
  const { rows } = await pool.query(sql, [assignmentId])
  return rows[0] ?? null
}

async function getTrailByAssignment(assignmentId: number, sinceIso?: string, limit = 200) {
  const clauses: string[] = ["roster_shift_assignment_id = $1"]
  const params: any[] = [assignmentId]

  if (sinceIso) {
    clauses.push(`recorded_at >= $2`)
    params.push(sinceIso)
  }

  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(1000, limit)) : 200

  const sql = `
    SELECT movement_log_id, company_id, roster_shift_assignment_id,
           location_lat, location_long, accuracy_m, speed_mps, heading_deg,
           altitude_m, provider, battery_pct, is_mock, recorded_at
    FROM public.roster_shift_movement_logs
    WHERE ${clauses.join(" AND ")}
    ORDER BY recorded_at DESC
    LIMIT ${safeLimit}
  `
  const { rows } = await pool.query(sql, params)
  return rows ?? []
}

/** ---------- existing UI state logic (unchanged) ---------- */
function computeUiState(input: {
  nowUtc: Date
  startUtc: Date
  shiftCreatedAtUtc: Date
  hasShiftCreatedConfirm: boolean
  has24hConfirm: boolean
  has2hConfirm: boolean
  bookOnAt: Date | null
  bookOffAt: Date | null
}) {
  const { nowUtc, startUtc, shiftCreatedAtUtc } = input

  const msToStart = startUtc.getTime() - nowUtc.getTime()
  const minsToStart = Math.floor(msToStart / 60000)

  const startMinus24h = new Date(startUtc.getTime() - 24 * 60 * 60 * 1000)
  const startMinus2h  = new Date(startUtc.getTime() - 2 * 60 * 60 * 1000)

  const eligible24h = shiftCreatedAtUtc.getTime() <= startMinus24h.getTime()
  const eligible2h  = shiftCreatedAtUtc.getTime() <= startMinus2h.getTime()

  const in24hWindow = nowUtc >= startMinus24h && nowUtc < startMinus2h && minsToStart > 0
  const in2hWindow = nowUtc >= startMinus2h && minsToStart > 0

  if (!input.hasShiftCreatedConfirm) {
    return {
      phase: "confirm_shift_created" as const,
      minsToStart,
      show: { confirm_shift_created: true, confirm_24h: false, confirm_2h: false, eta: false, book_on: false, book_off: false, checkpoints: false },
    }
  }

  if (eligible24h && in24hWindow && !input.has24hConfirm) {
    return {
      phase: "confirm_24h" as const,
      minsToStart,
      show: { confirm_shift_created: false, confirm_24h: true, confirm_2h: false, eta: false, book_on: false, book_off: false, checkpoints: false },
    }
  }

  if (eligible2h && in2hWindow && !input.has2hConfirm) {
    return {
      phase: "confirm_2h" as const,
      minsToStart,
      show: { confirm_shift_created: false, confirm_24h: false, confirm_2h: true, eta: false, book_on: false, book_off: false, checkpoints: false },
    }
  }

  const isBookedOn = !!input.bookOnAt
  const isBookedOff = !!input.bookOffAt

  const etaVisible = minsToStart > 15
  const inBookOnWindow = minsToStart <= 15 && minsToStart > -120

  if (!isBookedOn) {
    if (etaVisible) {
      return { phase: "eta" as const, minsToStart, show: { confirm_shift_created: false, confirm_24h: false, confirm_2h: false, eta: true, book_on: false, book_off: false, checkpoints: false } }
    }
    if (inBookOnWindow) {
      return { phase: "book_on" as const, minsToStart, show: { confirm_shift_created: false, confirm_24h: false, confirm_2h: false, eta: false, book_on: true, book_off: false, checkpoints: false } }
    }
    return { phase: "waiting" as const, minsToStart, show: { confirm_shift_created: false, confirm_24h: false, confirm_2h: false, eta: false, book_on: false, book_off: false, checkpoints: false } }
  }

  if (isBookedOn && !isBookedOff) {
    return { phase: "in_shift" as const, minsToStart, show: { confirm_shift_created: false, confirm_24h: false, confirm_2h: false, eta: false, book_on: false, book_off: true, checkpoints: true } }
  }

  return { phase: "completed" as const, minsToStart, show: { confirm_shift_created: false, confirm_24h: false, confirm_2h: false, eta: false, book_on: false, book_off: false, checkpoints: false } }
}

/**
 * GET /api/mobile/tracking/shift-ui-state?assignmentId=123
 */
router.get("/shift-ui-state", async (req: Request, res: Response): Promise<void> => {
  const assignmentId = Number(req.query.assignmentId)

  if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
    res.status(400).json({ message: "Invalid assignmentId" })
    return
  }

  const w = await fetchAssignmentWindow(assignmentId)
  if (!w) {
    res.status(404).json({ message: "Assignment not found" })
    return
  }

  const a = await pool.query(
    `
    SELECT created_at, book_on_at, book_off_at, eta
    FROM public.roster_shift_assignments
    WHERE roster_shift_assignment_id = $1
    LIMIT 1
    `,
    [assignmentId]
  )

  if (!a.rows.length) {
    res.status(404).json({ message: "Assignment not found" })
    return
  }

  const assignmentRow = a.rows[0]
  const reminderState = await getReminderState(assignmentId, Number(w.company_id))

  const nowUtc = new Date()
  const startUtc = new Date(w.start_ts_utc)
  const createdAtUtc = new Date(assignmentRow.created_at)

  const ui = computeUiState({
    nowUtc,
    startUtc,
    shiftCreatedAtUtc: createdAtUtc,
    hasShiftCreatedConfirm: !!reminderState.has_shift_created,
    has24hConfirm: !!reminderState.has_24h,
    has2hConfirm: !!reminderState.has_2h,
    bookOnAt: assignmentRow.book_on_at ? new Date(assignmentRow.book_on_at) : null,
    bookOffAt: assignmentRow.book_off_at ? new Date(assignmentRow.book_off_at) : null,
  })

  res.json({
    ok: true,
    data: {
      assignmentId,
      companyId: Number(w.company_id),
      start_ts_utc: startUtc.toISOString(),
      minsToStart: ui.minsToStart,
      phase: ui.phase,
      show: ui.show,
      confirmations: {
        shift_created_done: !!reminderState.has_shift_created,
        c24h_done: !!reminderState.has_24h,
        c2h_done: !!reminderState.has_2h,
      },
      eta: assignmentRow.eta ?? null,
      book_on_at: assignmentRow.book_on_at ?? null,
      book_off_at: assignmentRow.book_off_at ?? null,
    },
  })
})

/**
 * ✅ POST /api/mobile/tracking/telemetry
 * Body supports numbers OR numeric strings.
 */
router.post("/telemetry", async (req: Request, res: Response): Promise<void> => {
  try {
    const b = req.body ?? {}

    const company_id = toNum((b as any).company_id)
    const roster_shift_assignment_id = toNum((b as any).roster_shift_assignment_id)

    const location_lat = toNum((b as any).location_lat)
    const location_long = toNum((b as any).location_long)

    const accuracy_m = toNum((b as any).accuracy_m)
    const speed_mps = toNum((b as any).speed_mps)
    const heading_deg = toNum((b as any).heading_deg)
    const altitude_m = toNum((b as any).altitude_m)
    const battery_pct = toNum((b as any).battery_pct)

    const provider = typeof (b as any).provider === "string" ? String((b as any).provider) : null
    const is_mock = toBool((b as any).is_mock) ?? false

    if (company_id === null || roster_shift_assignment_id === null) {
      res.status(400).json({ ok: false, error: "company_id and roster_shift_assignment_id are required numbers" })
      return
    }
    if (location_lat === null || location_long === null) {
      res.status(400).json({ ok: false, error: "location_lat and location_long are required numbers" })
      return
    }
    if (location_lat < -90 || location_lat > 90 || location_long < -180 || location_long > 180) {
      res.status(400).json({ ok: false, error: "location_lat/long out of bounds" })
      return
    }

    // Optional but strongly recommended: avoid inserting telemetry for wrong/unknown assignment
    const exists = await assignmentExists(company_id, roster_shift_assignment_id)
    if (!exists) {
      res.status(404).json({ ok: false, error: "Assignment not found for company" })
      return
    }

    const created = await insertMovementLog({
      company_id,
      roster_shift_assignment_id,
      location_lat,
      location_long,
      accuracy_m: accuracy_m ?? null,
      speed_mps: speed_mps ?? null,
      heading_deg: heading_deg ?? null,
      altitude_m: altitude_m ?? null,
      provider,
      battery_pct: battery_pct ?? null,
      is_mock,
    })

    res.status(201).json({ ok: true, data: created })
  } catch (err: any) {
    console.error("telemetry insert error:", err)
    res.status(500).json({ ok: false, error: "Internal server error", details: err?.message })
  }
})

/**
 * ✅ GET /api/mobile/tracking/telemetry/latest/:assignmentId
 */
router.get("/telemetry/latest/:assignmentId", async (req: Request, res: Response): Promise<void> => {
  try {
    const assignmentId = Number(req.params.assignmentId)
    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      res.status(400).json({ ok: false, error: "Invalid assignmentId" })
      return
    }
    const row = await getLatestMovementByAssignment(assignmentId)
    res.json({ ok: true, data: row ?? null })
  } catch (err: any) {
    console.error("telemetry latest error:", err)
    res.status(500).json({ ok: false, error: "Internal server error", details: err?.message })
  }
})

/**
 * ✅ GET /api/mobile/tracking/telemetry/trail/:assignmentId?since=ISO&limit=200
 */
router.get("/telemetry/trail/:assignmentId", async (req: Request, res: Response): Promise<void> => {
  try {
    const assignmentId = Number(req.params.assignmentId)
    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      res.status(400).json({ ok: false, error: "Invalid assignmentId" })
      return
    }

    const since = typeof req.query.since === "string" ? req.query.since : undefined
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 200

    const rows = await getTrailByAssignment(assignmentId, since, Number.isFinite(limit) ? limit : 200)
    res.json({ ok: true, data: rows ?? [] })
  } catch (err: any) {
    console.error("telemetry trail error:", err)
    res.status(500).json({ ok: false, error: "Internal server error", details: err?.message })
  }
})

/** ---------------- existing routes below (unchanged) ---------------- */

/**
 * POST /api/mobile/tracking/reminder-confirm
 */
router.post("/reminder-confirm", async (req: Request, res: Response): Promise<void> => {
  const { assignmentId, userId, companyId, type, response } = (req.body ?? {}) as Record<string, unknown>

  const aid = Number(assignmentId)
  const uid = Number(userId)
  const cid = Number(companyId)

  if (!Number.isFinite(aid) || aid <= 0) {
    res.status(400).json({ message: "Invalid assignmentId" })
    return
  }
  if (!Number.isFinite(uid) || uid <= 0) {
    res.status(400).json({ message: "Invalid userId" })
    return
  }
  if (!Number.isFinite(cid) || cid <= 0) {
    res.status(400).json({ message: "Invalid companyId" })
    return
  }

  const okType = type === "shift_created" || type === "24h" || type === "2h"
  const okResp = response === "accept" || response === "decline"
  if (!okType) {
    res.status(400).json({ message: "Invalid type" })
    return
  }
  if (!okResp) {
    res.status(400).json({ message: "Invalid response" })
    return
  }

  const event_type = eventTypeFor(type as ReminderType, response as ReminderResponse)

  await pool.query(
    `
    INSERT INTO public.roster_shift_time_logs
      (company_id, roster_shift_assignment_id, event_type, event_time, event_notes, meta_json)
    VALUES
      ($1, $2, $3, now(), $4, $5)
    `,
    [cid, aid, event_type, `user=${uid}`, JSON.stringify({ user_id: uid, confirm_type: type, response })]
  )

  if (type === "shift_created") {
    await pool.query(
      `
      UPDATE public.roster_shift_assignments
      SET employee_shift_status = $1, updated_at = now()
      WHERE roster_shift_assignment_id = $2 AND company_id = $3
      `,
      [response === "accept" ? "confirmed" : "unconfirmed", aid, cid]
    )
  }

  res.json({ ok: true })
})

/**
 * POST /api/mobile/tracking/set-eta
 */
router.post("/set-eta", async (req: Request, res: Response): Promise<void> => {
  const { assignmentId, companyId, eta_minutes, userId } = (req.body ?? {}) as Record<string, unknown>

  const aid = Number(assignmentId)
  const cid = Number(companyId)
  const uid = Number(userId)

  if (!Number.isFinite(aid) || aid <= 0) {
    res.status(400).json({ message: "Invalid assignmentId" })
    return
  }
  if (!Number.isFinite(cid) || cid <= 0) {
    res.status(400).json({ message: "Invalid companyId" })
    return
  }
  if (!Number.isFinite(uid) || uid <= 0) {
    res.status(400).json({ message: "Invalid userId" })
    return
  }

  const eta =
    eta_minutes === null || eta_minutes === undefined || eta_minutes === ""
      ? null
      : Math.max(0, Math.floor(Number(eta_minutes)))

  if (eta !== null && !Number.isFinite(eta)) {
    res.status(400).json({ message: "Invalid eta_minutes" })
    return
  }

  await pool.query(
    `
    UPDATE public.roster_shift_assignments
    SET eta = $1, updated_at = now()
    WHERE roster_shift_assignment_id = $2 AND company_id = $3
    `,
    [eta, aid, cid]
  )

  await pool.query(
    `
    INSERT INTO public.roster_shift_time_logs
      (company_id, roster_shift_assignment_id, event_type, event_time, event_notes, meta_json)
    VALUES
      ($1, $2, 'arrived', now(), $3, $4)
    `,
    [cid, aid, `eta_set_by_user=${uid}`, JSON.stringify({ user_id: uid, eta_minutes: eta })]
  )

  res.json({ ok: true })
})

/**
 * POST /api/mobile/tracking/book-on
 */
router.post("/book-on", async (req: Request, res: Response): Promise<void> => {
  const { assignmentId, companyId, userId, photoPath } = (req.body ?? {}) as Record<string, unknown>

  const aid = Number(assignmentId)
  const cid = Number(companyId)
  const uid = Number(userId)

  if (!Number.isFinite(aid) || aid <= 0) {
    res.status(400).json({ message: "Invalid assignmentId" })
    return
  }
  if (!Number.isFinite(cid) || cid <= 0) {
    res.status(400).json({ message: "Invalid companyId" })
    return
  }
  if (!Number.isFinite(uid) || uid <= 0) {
    res.status(400).json({ message: "Invalid userId" })
    return
  }

  await pool.query(
    `
    UPDATE public.roster_shift_assignments
    SET book_on_at = COALESCE(book_on_at, now()),
        book_on_photo = COALESCE($1, book_on_photo),
        updated_at = now()
    WHERE roster_shift_assignment_id = $2 AND company_id = $3
    `,
    [photoPath ?? null, aid, cid]
  )

  await pool.query(
    `
    INSERT INTO public.roster_shift_time_logs
      (company_id, roster_shift_assignment_id, event_type, event_time, event_notes, meta_json)
    VALUES
      ($1, $2, 'book_on', now(), $3, $4)
    `,
    [cid, aid, `user=${uid}`, JSON.stringify({ user_id: uid })]
  )

  res.json({ ok: true })
})

/**
 * POST /api/mobile/tracking/book-off
 */
router.post("/book-off", async (req: Request, res: Response): Promise<void> => {
  const { assignmentId, companyId, userId, photoPath } = (req.body ?? {}) as Record<string, unknown>

  const aid = Number(assignmentId)
  const cid = Number(companyId)
  const uid = Number(userId)

  if (!Number.isFinite(aid) || aid <= 0) {
    res.status(400).json({ message: "Invalid assignmentId" })
    return
  }
  if (!Number.isFinite(cid) || cid <= 0) {
    res.status(400).json({ message: "Invalid companyId" })
    return
  }
  if (!Number.isFinite(uid) || uid <= 0) {
    res.status(400).json({ message: "Invalid userId" })
    return
  }

  const chk = await pool.query(
    `
    SELECT book_on_at, book_off_at
    FROM public.roster_shift_assignments
    WHERE roster_shift_assignment_id = $1 AND company_id = $2
    LIMIT 1
    `,
    [aid, cid]
  )

  if (!chk.rows.length) {
    res.status(404).json({ message: "Assignment not found" })
    return
  }
  if (!chk.rows[0].book_on_at) {
    res.status(400).json({ message: "Cannot book off before book on" })
    return
  }
  if (chk.rows[0].book_off_at) {
    res.status(200).json({ ok: true })
    return
  }

  await pool.query(
    `
    UPDATE public.roster_shift_assignments
    SET book_off_at = now(),
        book_off_photo = COALESCE($1, book_off_photo),
        assignment_status = 'completed',
        updated_at = now()
    WHERE roster_shift_assignment_id = $2 AND company_id = $3
    `,
    [photoPath ?? null, aid, cid]
  )

  await pool.query(
    `
    INSERT INTO public.roster_shift_time_logs
      (company_id, roster_shift_assignment_id, event_type, event_time, event_notes, meta_json)
    VALUES
      ($1, $2, 'book_off', now(), $3, $4)
    `,
    [cid, aid, `user=${uid}`, JSON.stringify({ user_id: uid })]
  )

  res.json({ ok: true })
})

export default router
