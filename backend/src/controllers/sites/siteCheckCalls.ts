import { RequestHandler } from 'express';
import {
  insertCheckCall,
  getCheckCallsBySite
} from '../../models/sites/siteCheckCalls';

/**
 * POST /api/sites/:siteId/check-calls
 * body: { scheduled_time: "HH:MM" }
 */
export const addCheckCall: RequestHandler = async (req, res) => {
  const siteId = parseInt(req.params.siteId, 10);
  const { scheduled_time } = req.body as { scheduled_time?: string };

  if (isNaN(siteId) || !scheduled_time) {
    res.status(400).json({ error: 'siteId and scheduled_time are required' });
    return;
  }

  try {
    const row = await insertCheckCall(siteId, `${scheduled_time}:00`);
    res.status(201).json(row);
  } catch (err: any) {
    if (err.code === '23505') {     // unique violation
      res.status(409).json({ error: 'Time already exists for this site' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Server error while adding check-call' });
    }
  }
};

/**
 * GET /api/sites/:siteId/check-calls
 */
export const listCheckCalls: RequestHandler = async (req, res) => {
  const siteId = parseInt(req.params.siteId, 10);
  if (isNaN(siteId)) {
    res.status(400).json({ error: 'Invalid site ID' });
    return;
  }
  try {
    const rows = await getCheckCallsBySite(siteId);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching check-calls' });
  }
};
