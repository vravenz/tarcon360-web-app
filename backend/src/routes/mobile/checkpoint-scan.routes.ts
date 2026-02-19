// src/routes/mobile/checkpoint-scan.routes.ts

import { Router, type RequestHandler } from "express"
import pool from "../../config/database"

const router = Router()

function toNum(v: any): number | null {
  const n = typeof v === "string" ? Number(v) : v
  return Number.isFinite(n) ? n : null
}

function asUuid(v: any): string | null {
  if (!v) return null
  const s = String(v).trim()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)) return null
  return s
}

/**
 * GET /api/mobile/checkpoint-scan/list?assignmentId=123&companyId=1
 */
const listHandler: RequestHandler = async (req, res) => {
  try {
    const assignmentId = toNum(req.query.assignmentId)
    const companyId = toNum(req.query.companyId)

    if (!assignmentId || assignmentId <= 0) {
      res.status(400).json({ ok: false, error: "assignmentId required" })
      return
    }
    if (!companyId || companyId <= 0) {
      res.status(400).json({ ok: false, error: "companyId required" })
      return
    }

    // ✅ roster_shifts has roster_id, roster has site_id
    const a = await pool.query(
      `
      SELECT
        rsa.roster_shift_assignment_id,
        rsa.company_id,
        rsa.roster_employee_id,
        r.site_id,
        rsa.book_on_at,
        rsa.book_off_at
      FROM public.roster_shift_assignments rsa
      JOIN public.roster_shifts rs
        ON rs.roster_shift_id = rsa.roster_shift_id
      JOIN public.roster r
        ON r.roster_id = rs.roster_id
      WHERE rsa.roster_shift_assignment_id = $1
        AND rsa.company_id = $2
      LIMIT 1
      `,
      [assignmentId, companyId]
    )

    if (!a.rows.length) {
      res.status(404).json({ ok: false, error: "assignment not found" })
      return
    }

    const { site_id, roster_employee_id, book_on_at, book_off_at } = a.rows[0]

    const cps = await pool.query(
      `
      SELECT
        sc.checkpoint_id,
        sc.site_id,
        sc.checkpoint_number,
        sc.checkpoint_name,
        sc.scheduled_check_time::text as scheduled_check_time,
        sc.qr_token::text as qr_token
      FROM public.site_checkpoints sc
      WHERE sc.site_id = $1
        AND sc.is_deleted = false
      ORDER BY sc.checkpoint_number ASC
      `,
      [site_id]
    )

    const scans = await pool.query(
      `
      SELECT
        checkpoint_id,
        max(actual_time) as last_scan_time
      FROM public.checkpoint_scans
      WHERE roster_employee_id = $1
        AND scheduled_date = CURRENT_DATE
      GROUP BY checkpoint_id
      `,
      [roster_employee_id]
    )

    const lastMap = new Map<number, string>()
    for (const r of scans.rows) lastMap.set(Number(r.checkpoint_id), r.last_scan_time)

    res.json({
      ok: true,
      data: {
        assignmentId,
        companyId,
        book_on_at: book_on_at ?? null,
        book_off_at: book_off_at ?? null,
        checkpoints: cps.rows.map((c: any) => ({
          checkpoint_id: Number(c.checkpoint_id),
          checkpoint_number: Number(c.checkpoint_number),
          checkpoint_name: c.checkpoint_name ?? null,
          scheduled_check_time: c.scheduled_check_time ?? null,
          qr_token: String(c.qr_token),
          last_scan_time: lastMap.get(Number(c.checkpoint_id)) ?? null,
        })),
      },
    })
    return
  } catch (err: any) {
    console.error("checkpoint-scan list error:", err)
    res.status(500).json({ ok: false, error: "Internal server error", details: err?.message })
    return
  }
}

/**
 * POST /api/mobile/checkpoint-scan/scan
 */
const scanHandler: RequestHandler = async (req, res) => {
  try {
    const b = req.body ?? {}

    const companyId = toNum(b.companyId)
    const assignmentId = toNum(b.assignmentId)
    const qrToken = asUuid(b.qrToken)

    const actual_latitude = toNum(b.actual_latitude)
    const actual_longitude = toNum(b.actual_longitude)

    if (!companyId || companyId <= 0) {
      res.status(400).json({ ok: false, error: "companyId required" })
      return
    }
    if (!assignmentId || assignmentId <= 0) {
      res.status(400).json({ ok: false, error: "assignmentId required" })
      return
    }
    if (!qrToken) {
      res.status(400).json({ ok: false, error: "qrToken (uuid) required" })
      return
    }

    // ✅ same join pattern
    const a = await pool.query(
      `
      SELECT
        rsa.roster_shift_assignment_id,
        rsa.company_id,
        rsa.roster_employee_id,
        rsa.book_on_at,
        rsa.book_off_at,
        r.site_id,
        s.site_latitude,
        s.site_longitude,
        s.site_radius
      FROM public.roster_shift_assignments rsa
      JOIN public.roster_shifts rs
        ON rs.roster_shift_id = rsa.roster_shift_id
      JOIN public.roster r
        ON r.roster_id = rs.roster_id
      LEFT JOIN public.sites s
        ON s.site_id = r.site_id
      WHERE rsa.roster_shift_assignment_id = $1
        AND rsa.company_id = $2
      LIMIT 1
      `,
      [assignmentId, companyId]
    )

    if (!a.rows.length) {
      res.status(404).json({ ok: false, error: "assignment not found" })
      return
    }

    const row = a.rows[0]

    if (!row.book_on_at) {
      res.status(400).json({ ok: false, error: "Cannot scan before book on" })
      return
    }
    if (row.book_off_at) {
      res.status(400).json({ ok: false, error: "Cannot scan after book off" })
      return
    }

    const cp = await pool.query(
      `
      SELECT
        checkpoint_id,
        site_id,
        scheduled_check_time
      FROM public.site_checkpoints
      WHERE site_id = $1
        AND is_deleted = false
        AND qr_token::text = $2
      LIMIT 1
      `,
      [row.site_id, String(qrToken)]
    )

    if (!cp.rows.length) {
      res.status(400).json({ ok: false, error: "Invalid QR for this site" })
      return
    }

    const checkpoint = cp.rows[0]

    const insert = await pool.query(
      `
      INSERT INTO public.checkpoint_scans
        (checkpoint_id, roster_employee_id, scheduled_time, actual_time, status,
         site_latitude_snapshot, site_longitude_snapshot, site_radius_snapshot,
         actual_latitude, actual_longitude, scheduled_date)
      VALUES
        ($1, $2, $3, now(), 'completed',
         $4, $5, $6,
         $7, $8, CURRENT_DATE)
      RETURNING scan_id, checkpoint_id, roster_employee_id, actual_time, status, actual_latitude, actual_longitude
      `,
      [
        Number(checkpoint.checkpoint_id),
        Number(row.roster_employee_id),
        checkpoint.scheduled_check_time ?? null,
        Number(row.site_latitude ?? 0),
        Number(row.site_longitude ?? 0),
        Number(row.site_radius ?? 0),
        Number(actual_latitude ?? 0),
        Number(actual_longitude ?? 0),
      ]
    )

    res.status(201).json({ ok: true, data: insert.rows[0] })
    return
  } catch (err: any) {
    console.error("checkpoint-scan scan error:", err)
    res.status(500).json({ ok: false, error: "Internal server error", details: err?.message })
    return
  }
}

router.get("/list", listHandler)
router.post("/scan", scanHandler)

export default router
