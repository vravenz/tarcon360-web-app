// backend/src/routes/telemetryRoutes.ts
import { Router, RequestHandler } from 'express';
import { postTelemetry, getLatest, getTrail } from '../controllers/roster/telemetryController';

const router = Router();

// Option A: define a typed handler variable
const ping: RequestHandler = (_req, res) => {
  res.json({ ok: true, route: 'tracking' });
};
router.get('/ping', ping);

// Option B: inline with explicit param types and void return
router.post('/telemetry', postTelemetry);
router.get('/latest/:assignmentId', getLatest);
router.get('/trail/:assignmentId', getTrail);

export default router;
