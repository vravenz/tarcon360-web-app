// src/routes/rosterCheckpointRoutes.ts
import express from 'express';
import {
  seedCheckpointsSingle,
  listCheckpointsForAssignment,
  updateCheckpoint
} from '../controllers/roster/rosterShiftCheckpoints';

const router = express.Router();

router.post(
  '/assignments/:id/checkpoints/seed',
  seedCheckpointsSingle
);
router.get(
  '/assignments/:id/checkpoints',
  listCheckpointsForAssignment
);
router.patch(
  '/checkpoints/:scanId',
  updateCheckpoint
);

export default router;
