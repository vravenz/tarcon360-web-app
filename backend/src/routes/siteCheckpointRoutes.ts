import express from 'express';
import {
  createCheckpointForSite,
  getSiteCheckpoints
} from '../controllers/sites/siteCheckpoints';

const router = express.Router();

// Create a new checkpoint for a site
router.post('/:siteId/checkpoints', createCheckpointForSite);

// Fetch all checkpoints for a site
router.get('/:siteId/checkpoints', getSiteCheckpoints);

export default router;
