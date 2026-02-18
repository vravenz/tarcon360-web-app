// src/controllers/sites/siteCheckpoints.ts
import { RequestHandler } from 'express'
import pool from '../../config/database'
import {
  insertCheckpoint,
  getCheckpointsBySite,
  SiteCheckpoint
} from '../../models/sites/siteCheckpoints'

/**
 * POST /api/sites/:siteId/checkpoints
 */
export const createCheckpointForSite: RequestHandler = async (req, res) => {
  const siteId = parseInt(req.params.siteId, 10)
  if (isNaN(siteId)) {
    res.status(400).json({ error: 'Invalid site ID' })
    return
  }

  let siteRow
  try {
    const result = await pool.query(
      `SELECT is_mobile_allowed
         FROM sites
        WHERE site_id = $1`,
      [siteId]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Site not found' })
      return
    }
    siteRow = result.rows[0]
  } catch (err) {
    console.error('Error loading site:', err)
    res.status(500).json({ error: 'Server error while verifying site' })
    return
  }

  if (!siteRow.is_mobile_allowed) {
    res.status(403).json({ error: 'Mobile check-ins are not allowed for this site' })
    return
  }

  const checkpoint_number    = parseInt(req.body.checkpoint_number, 10)
  const checkpoint_name      = req.body.checkpoint_name ?? null
  const scheduled_check_time = req.body.scheduled_check_time ?? null

  if (isNaN(checkpoint_number)) {
    res.status(400).json({ error: 'Missing or invalid checkpoint_number' })
    return
  }

  try {
    const newCp: SiteCheckpoint = await insertCheckpoint({
      site_id:             siteId,
      checkpoint_number,
      checkpoint_name,
      scheduled_check_time
    })
    res.status(201).json(newCp)
  } catch (err) {
    console.error('Error creating checkpoint:', err)
    res.status(500).json({ error: 'Server error while creating checkpoint' })
  }
}

/**
 * GET /api/sites/:siteId/checkpoints
 */
export const getSiteCheckpoints: RequestHandler = async (req, res) => {
  const siteId = parseInt(req.params.siteId, 10)
  if (isNaN(siteId)) {
    res.status(400).json({ error: 'Invalid site ID' })
    return
  }

  try {
    const cps = await getCheckpointsBySite(siteId)
    res.json(cps)
  } catch (err) {
    console.error('Error fetching checkpoints:', err)
    res.status(500).json({ error: 'Server error while fetching checkpoints' })
  }
}
