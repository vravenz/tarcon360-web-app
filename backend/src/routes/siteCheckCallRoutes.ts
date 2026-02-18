import express from 'express';
import {
  addCheckCall,
  listCheckCalls
} from '../controllers/sites/siteCheckCalls';

const router = express.Router({ mergeParams: true });

router.post('/:siteId/check-calls', addCheckCall);
router.get('/:siteId/check-calls', listCheckCalls);

export default router;
