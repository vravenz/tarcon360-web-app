// src/routes/rosterShiftCheckCallRoutes.ts
import express from 'express';
import {
  seedCheckCallsSingle,
  listCheckCallsForAssignment
} from '../controllers/roster/rosterShiftCheckCalls';

const router = express.Router();

// seed upcoming check calls
router.post(
  '/assignments/:id/check-calls/seed',
  seedCheckCallsSingle
);

// list check calls
router.get(
  '/assignments/:id/check-calls',
  listCheckCallsForAssignment
);

export default router;
