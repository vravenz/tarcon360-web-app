import { RequestHandler } from 'express';
import {
  insertMovementLog,
  getLatestMovementByAssignment,
  getTrailByAssignment,
} from '../../models/roster/rosterShiftMovementLogs';

const isNum = (v: any) => typeof v === 'number' && Number.isFinite(v);

export const postTelemetry: RequestHandler = async (req, res) => {
  try {
    const {
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
    } = req.body ?? {};

    if (!isNum(company_id) || !isNum(roster_shift_assignment_id)) {
      res.status(400).json({ error: 'company_id and roster_shift_assignment_id are required numbers' });
      return;
    }
    if (!isNum(location_lat) || !isNum(location_long)) {
      res.status(400).json({ error: 'location_lat and location_long are required numbers' });
      return;
    }
    if (location_lat < -90 || location_lat > 90 || location_long < -180 || location_long > 180) {
      res.status(400).json({ error: 'location_lat/long out of bounds' });
      return;
    }

    const created = await insertMovementLog({
      company_id,
      roster_shift_assignment_id,
      location_lat,
      location_long,
      accuracy_m: isNum(accuracy_m) ? accuracy_m : null,
      speed_mps:  isNum(speed_mps)  ? speed_mps  : null,
      heading_deg:isNum(heading_deg)? heading_deg: null,
      altitude_m: isNum(altitude_m) ? altitude_m : null,
      provider: typeof provider === 'string' ? provider : null,
      battery_pct: isNum(battery_pct) ? battery_pct : null,
      is_mock: typeof is_mock === 'boolean' ? is_mock : false,
    });

    res.status(201).json({ ok: true, data: created });
  } catch (err: any) {
    console.error('postTelemetry error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

export const getLatest: RequestHandler = async (req, res) => {
  try {
    const assignmentId = Number(req.params.assignmentId);
    if (!Number.isFinite(assignmentId)) {
      res.status(400).json({ error: 'Invalid assignmentId' });
      return;
    }
    const row = await getLatestMovementByAssignment(assignmentId);
    // ✅ Return 200 with null when no data instead of 404
    res.json({ ok: true, data: row ?? null });
  } catch (err: any) {
    console.error('getLatest error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

export const getTrail: RequestHandler = async (req, res) => {
  try {
    const assignmentId = Number(req.params.assignmentId);
    if (!Number.isFinite(assignmentId)) {
      res.status(400).json({ error: 'Invalid assignmentId' });
      return;
    }
    const { since, limit } = req.query as { since?: string; limit?: string };
    const rows = await getTrailByAssignment(
      assignmentId,
      since,
      limit ? Number(limit) : 200
    );
    // ✅ Always 200, even if empty
    res.json({ ok: true, data: rows ?? [] });
  } catch (err: any) {
    console.error('getTrail error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

