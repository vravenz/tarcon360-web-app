import { Router, Request, Response } from "express"
import { findAssignmentsForUser, countAssignmentsForUser } from "../../models/roster/assignmentList"

const router = Router()

function toInt(v: any, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function asYmd(v: any): string | undefined {
  if (!v) return undefined
  const s = String(v).trim()
  // very light validation (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined
  return s
}

/**
 * GET /api/mobile/roster/assignments
 * Query:
 *  - companyId (required)
 *  - dateFrom (optional) YYYY-MM-DD
 *  - dateTo   (optional) YYYY-MM-DD
 *  - limit    (optional) default 50, max 200
 *  - offset   (optional) default 0
 *
 * Auth:
 *  - uses JWT payload user id (req.user.id) to scope assignments
 */
router.get("/assignments", async (req: Request, res: Response): Promise<void> => {
  try {
    // You likely already attach JWT payload to req.user in your auth middleware.
    // If not, adjust this to match your project.
    const authedUserId = (req as any)?.user?.id

    const companyId = toInt(req.query.companyId, 0)
    if (!companyId || companyId <= 0) {
      res.status(400).json({ ok: false, error: "companyId is required" })
      return
    }

    if (!authedUserId || Number(authedUserId) <= 0) {
      res.status(401).json({ ok: false, error: "Unauthorized" })
      return
    }

    const dateFrom = asYmd(req.query.dateFrom)
    const dateTo = asYmd(req.query.dateTo)

    let limit = toInt(req.query.limit, 50)
    let offset = toInt(req.query.offset, 0)

    if (limit <= 0) limit = 50
    if (limit > 200) limit = 200
    if (offset < 0) offset = 0

    const [rows, total] = await Promise.all([
      findAssignmentsForUser({
        companyId,
        userId: Number(authedUserId),
        dateFrom,
        dateTo,
        limit,
        offset,
      }),
      countAssignmentsForUser({
        companyId,
        userId: Number(authedUserId),
        dateFrom,
        dateTo,
      }),
    ])

    res.json({
      ok: true,
      data: rows,
      meta: {
        total,
        limit,
        offset,
        dateFrom: dateFrom ?? null,
        dateTo: dateTo ?? null,
      },
    })
  } catch (err: any) {
    console.error("mobile roster assignments error:", err)
    res.status(500).json({ ok: false, error: "Internal server error" })
  }
})

export default router
