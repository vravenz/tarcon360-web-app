// backend/src/routes/bookOnOffRoutes.ts
import { Router } from 'express';
import {
  uploadBookPhoto,
  bookOnController,
  bookOffController,
} from '../controllers/roster/bookOnOffController';

const router = Router();

// POST /api/tracking/book-on/:assignmentId  (multipart/form-data, field: photo)
router.post('/book-on/:assignmentId', uploadBookPhoto, bookOnController);

// POST /api/tracking/book-off/:assignmentId (multipart/form-data, field: photo)
router.post('/book-off/:assignmentId', uploadBookPhoto, bookOffController);

export default router;
