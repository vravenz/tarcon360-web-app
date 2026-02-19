import { Request, Response } from 'express';
import pool from '../../config/database';

/**
 * PUT /api/tracking/eta/:assignmentId
 * Body: { eta: number | null }
 * Sets roster_shift_assignments.eta (minutes). Null clears.
 */
export const updateETA = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignmentId = Number(req.params.assignmentId ?? NaN);
    if (!Number.isFinite(assignmentId)) {
      res.status(400).json({ message: 'Invalid assignmentId' });
      return;
    }

    const rawEta = req.body?.eta;
    const eta =
      rawEta === null || rawEta === undefined
        ? null
        : Number.isFinite(Number(rawEta)) && Number(rawEta) >= 0
        ? Number(rawEta)
        : NaN;

    if (Number.isNaN(eta)) {
      res.status(400).json({ message: 'eta must be a non-negative number (minutes) or null' });
      return;
    }

    const q = `
      UPDATE public.roster_shift_assignments
      SET eta = $1, updated_at = NOW()
      WHERE roster_shift_assignment_id = $2
      RETURNING roster_shift_assignment_id, company_id, eta, updated_at
    `;
    const { rows } = await pool.query(q, [eta, assignmentId]);
    if (!rows.length) {
      res.status(404).json({ message: 'Assignment not found' });
      return;
    }

    res.json({ message: 'ETA updated', data: rows[0] });
  } catch (err: any) {
    console.error('updateETA error:', err);
    res.status(500).json({ message: 'Server error while updating ETA', details: err?.message });
  }
};

/**
 * POST /api/tracking/confirmations
 * Body: {
 *   assignment_id: number,
 *   type: 'shift_created' | '24h' | '2h',
 *   response: 'accept' | 'decline',
 *   notes?: string
 * }
 *
 * Writes a row in roster_shift_time_logs with one of:
 *   - reminder_shift_created_accept | reminder_shift_created_decline
 *   - reminder_24h_accept           | reminder_24h_decline
 *   - reminder_2h_accept            | reminder_2h_decline
 *
 * Business rule:
 *  - For type = 'shift_created':
 *      - accept  → set employee_shift_status='confirmed'
 *      - decline → set employee_shift_status='unconfirmed'
 *  - For 24h / 2h:
 *      - only log the event; do not change employee_shift_status
 */
export const createReminderConfirmation = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { assignment_id, type, response, notes } = req.body ?? {};

    const assignmentId = Number(assignment_id ?? NaN);
    if (!Number.isFinite(assignmentId)) {
      res.status(400).json({ message: 'assignment_id must be a number' });
      return;
    }
    if (!['shift_created', '24h', '2h'].includes(type)) {
      res.status(400).json({ message: "type must be one of: 'shift_created' | '24h' | '2h'" });
      return;
    }
    if (!['accept', 'decline'].includes(response)) {
      res.status(400).json({ message: "response must be 'accept' or 'decline'" });
      return;
    }

    // Get assignment + company
    const assQ = `
      SELECT company_id, employee_shift_status
      FROM public.roster_shift_assignments
      WHERE roster_shift_assignment_id = $1
      LIMIT 1
    `;
    const ass = await client.query(assQ, [assignmentId]);
    if (!ass.rows.length) {
      res.status(404).json({ message: 'Assignment not found' });
      return;
    }
    const company_id: number = ass.rows[0].company_id;

    const prefix =
      type === 'shift_created' ? 'reminder_shift_created'
      : type === '24h'        ? 'reminder_24h'
      :                         'reminder_2h';
    const event_type = `${prefix}_${response}`; // must be allowed by CHECK

    const responded_by: number | null =
      typeof (req as any).userId === 'number' ? (req as any).userId : null;

    await client.query('BEGIN');

    // For shift_created: update employee_shift_status depending on response
    if (type === 'shift_created') {
      const newStatus = response === 'accept' ? 'confirmed' : 'unconfirmed';
      const upQ = `
        UPDATE public.roster_shift_assignments
        SET employee_shift_status = $1, updated_at = NOW()
        WHERE roster_shift_assignment_id = $2
      `;
      await client.query(upQ, [newStatus, assignmentId]);
    }

    // Insert time log
    const insertQ = `
      INSERT INTO public.roster_shift_time_logs
        (company_id, roster_shift_assignment_id, event_type, event_time, event_notes, media_path, meta_json)
      VALUES
        ($1,         $2,                         $3,         NOW(),     $4,         NULL,       $5)
      RETURNING *
    `;
    const event_notes =
      notes ??
      (type === 'shift_created'
        ? `Shift created → ${response}`
        : type === '24h'
        ? `24h reminder → ${response}`
        : `2h reminder → ${response}`);

    const meta_json = {
      source: 'api',
      responded_by: responded_by,
      ip: req.ip,
      user_agent: req.headers['user-agent'] || null,
      type,
      response,
    };

    const ins = await client.query(insertQ, [
      company_id,
      assignmentId,
      event_type,
      event_notes,
      meta_json,
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Confirmation recorded',
      data: ins.rows[0],
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('createReminderConfirmation error:', err);
    res.status(500).json({ message: 'Server error while saving confirmation', details: err?.message });
  } finally {
    client.release();
  }
};
