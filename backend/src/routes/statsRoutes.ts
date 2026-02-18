// src/routes/statsRoutes.ts
import { Router } from 'express';
import { staffStats } from '../controllers/stats/staffStatsController';

const router = Router();
router.get('/staff/me', staffStats);       // uses x-user-id -> applicant_id
router.get('/staff/:staffId', staffStats); // :staffId is applicant_id
export default router;
