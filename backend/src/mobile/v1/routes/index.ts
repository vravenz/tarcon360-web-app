import { Router } from 'express';
import authRoutes from './authRoutes';

const router = Router();

// plug in all mobile v1 routes here
router.use('/auth', authRoutes);

export default router;
