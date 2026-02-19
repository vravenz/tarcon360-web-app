import { Request, Response } from 'express';
import { getPool } from "../../config/database"
const pool = () => getPool()
import {
  seedCheckCallsForAssignment,
  getCheckCallsByAssignment
} from '../../models/roster/rosterShiftCheckCalls';

/**
 * POST /api/assignments/:id/check-calls/seed
 * Automatically seed the check-calls for one assignment.
 */
export const seedCheckCallsSingle = async (req: Request, res: Response) => {
  const assignmentId = parseInt(req.params.id, 10);
  if (isNaN(assignmentId)) {
    res.status(400).json({ error: 'Invalid assignment id' });
    return;
  }

  try {
    // look up the shift’s dates & site_id
    const { rows } = await pool().query(
      `
      SELECT
        ra.roster_shift_assignment_id AS assignment_id,
        rs.shift_date        AS start_date,
        rs.shift_date        AS end_date,
        r.site_id
      FROM public.roster_shift_assignments ra
      JOIN public.roster_shifts       rs ON ra.roster_shift_id = rs.roster_shift_id
      JOIN public.roster              r  ON rs.roster_id        = r.roster_id
      WHERE ra.roster_shift_assignment_id = $1
      LIMIT 1;
      `,
      [assignmentId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    const { site_id, start_date, end_date } = rows[0];

    await seedCheckCallsForAssignment(
      assignmentId,
      site_id,
      start_date,
      end_date
    );

    res.status(201).json({ message: 'Check-calls seeded automatically' });
  } catch (err) {
    console.error('Error seeding check-calls:', err);
    res.status(500).json({ error: 'Server error while seeding check-calls' });
  }
};

/**
 * GET /api/assignments/:id/check-calls
 * List all check-calls for a given assignment.
 */
export const listCheckCallsForAssignment = async (req: Request, res: Response) => {
  const assignmentId = parseInt(req.params.id, 10);
  if (isNaN(assignmentId)) {
    res.status(400).json({ error: 'Invalid assignment id' });
    return;
  }

  try {
    const calls = await getCheckCallsByAssignment(assignmentId);
    res.json(calls);
  } catch (err) {
    console.error('Error fetching check-calls:', err);
    res.status(500).json({ error: 'Server error fetching check-calls' });
  }
};
