import { Router } from 'express';
import { mobileLogin } from '../controllers/authController';

const router = Router();
router.post('/login', mobileLogin);
export default router;
