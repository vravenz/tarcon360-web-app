// backend/src/controllers/roster/assignmentListController.ts
import { Request, Response } from 'express';
import {
  findAssignmentsForUser,
  countAssignmentsForUser,
} from '../../models/roster/assignmentList';

/**
 * GET /api/roster/assignments
 * Query params:
 *   - companyId (required, number)
 *   - userId (optional; defaults to req.userId via x-user-id header)
 *   - dateFrom (optional; YYYY-MM-DD)
 *   - dateTo   (optional; YYYY-MM-DD)
 *   - limit    (optional; default 50, max 200)
 *   - offset   (optional; default 0)
 */
export const listRosterAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = Number(req.query.companyId ?? NaN);
    if (!Number.isFinite(companyId)) {
      res.status(400).json({ message: 'companyId is required and must be a number' });
      return;
    }

    const userIdFromQuery = req.query.userId !== undefined ? Number(req.query.userId) : undefined;
    const userIdFromHeader = (req as any).userId as number | undefined;
    const userId = Number.isFinite(userIdFromQuery as number) ? userIdFromQuery : userIdFromHeader;

    const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom : undefined;
    const dateTo   = typeof req.query.dateTo   === 'string' ? req.query.dateTo   : undefined;

    const limit  = req.query.limit  ? Math.max(1, Math.min(200, Number(req.query.limit))) : 50;
    const offset = req.query.offset ? Math.max(0, Number(req.query.offset)) : 0;

    const [rows, total] = await Promise.all([
      findAssignmentsForUser({ companyId, userId, dateFrom, dateTo, limit, offset }),
      countAssignmentsForUser({ companyId, userId, dateFrom, dateTo }),
    ]);

    res.json({ total, limit, offset, data: rows });
  } catch (error: any) {
    console.error('Error listing roster assignments:', error);
    res.status(500).json({
      message: 'Server error while listing roster assignments',
      details: error?.message,
    });
  }
};
