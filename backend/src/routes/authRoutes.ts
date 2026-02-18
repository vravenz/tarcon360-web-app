import express from 'express';
import register from '../controllers/auth/registerController';
import { login } from '../controllers/auth/loginController';
const router = express.Router();

router.post('/register', register);
router.post('/login', login);  // Standard user login

export default router;
