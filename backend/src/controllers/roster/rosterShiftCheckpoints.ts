// src/controllers/roster/rosterShiftCheckpoints.ts
import type { RequestHandler } from 'express';
import { Request, Response } from 'express';
import { getPool } from "../../config/database"
const pool = getPool()
import {
  seedCheckpointsForAssignment,
  getCheckpointsByAssignment,
  updateCheckpointStatus
} from '../../models/roster/rosterShiftCheckpoints';

export const seedCheckpointsSingle: RequestHandler = async (req, res) => {
  const assignmentId = parseInt(req.params.id, 10);
  if (isNaN(assignmentId)) {
    res.status(400).json({ error: 'Invalid assignment id' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        ra.roster_employee_id,
        r.site_id,
        rs.shift_date AS start_date,
        rs.shift_date AS end_date
      FROM public.roster_shift_assignments ra
      JOIN public.roster_shifts rs ON ra.roster_shift_id = rs.roster_shift_id
      JOIN public.roster r        ON rs.roster_id        = r.roster_id
      WHERE ra.roster_shift_assignment_id = $1
      LIMIT 1;
      `,
      [assignmentId]
    );
    if (!rows.length) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    const { roster_employee_id, site_id, start_date, end_date } = rows[0];
    await seedCheckpointsForAssignment(
      roster_employee_id,
      site_id,
      start_date,
      end_date
    );
    res.status(201).json({ message: 'Checkpoints seeded automatically' });
  } catch (err) {
    console.error('Error seeding checkpoints:', err);
    res.status(500).json({ error: 'Server error while seeding checkpoints' });
  }
};

export const listCheckpointsForAssignment: RequestHandler = async (req, res) => {
  const assignmentId = parseInt(req.params.id, 10);
  if (isNaN(assignmentId)) {
    res.status(400).json({ error: 'Invalid assignment id' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `SELECT roster_employee_id
         FROM public.roster_shift_assignments
        WHERE roster_shift_assignment_id = $1
        LIMIT 1;`,
      [assignmentId]
    );
    if (!rows.length) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    const roster_employee_id = rows[0].roster_employee_id;
    const scans = await getCheckpointsByAssignment(roster_employee_id);
    res.json(scans);
  } catch (err) {
    console.error('Error fetching checkpoints:', err);
    res.status(500).json({ error: 'Server error fetching checkpoints' });
  }
};

export const updateCheckpoint: RequestHandler = async (req, res) => {
  const scanId = parseInt(req.params.scanId, 10);
  if (isNaN(scanId)) {
    res.status(400).json({ error: 'Invalid scan id' });
    return;
  }

  const {
    status,
    actual_time,
    actual_latitude,
    actual_longitude
  } = req.body;

  try {
    await updateCheckpointStatus(
      scanId,
      status,
      actual_time ?? null,
      actual_latitude ?? null,
      actual_longitude ?? null
    );
    res.json({ message: 'Checkpoint updated' });
  } catch (err) {
    console.error('Error updating checkpoint:', err);
    res.status(500).json({ error: 'Server error updating checkpoint' });
  }
};
