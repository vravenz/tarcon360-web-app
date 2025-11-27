import { Router } from 'express';
import { updateETA, createReminderConfirmation } from '../controllers/roster/reminderController';

const router = Router();

// ETA
router.put('/eta/:assignmentId', updateETA);

// Reminder confirmations
router.post('/confirmations', createReminderConfirmation);

export default router;
