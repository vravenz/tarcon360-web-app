import { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import { findUserByEmailOrPin } from '../../../models/user/userModel';
import { generateToken } from '../../../utils/jwtUtils';

export const mobileLogin: RequestHandler = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      res.status(400).json({ error: 'Email/PIN and password are required' });
      return;
    }

    const user = await findUserByEmailOrPin(identifier);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    // allow only role_id 3 or 4
    if (user.role_id !== 3 && user.role_id !== 4) {
      res.status(403).json({ error: 'Mobile access not permitted for this role' });
      return;
    }

    if (!user.is_active || user.is_dormant || user.is_deleted) {
      res.status(403).json({ error: 'Account status does not allow login.' });
      return;
    }

    const ok = await bcrypt.compare(password, user.password!);
    if (!ok) { res.status(401).json({ error: 'Invalid credentials' }); return; }

    const token = generateToken({
      id: user.id,
      role: user.role,
      company_id: user.company_id,
      branch_id: user.branch_id ?? 0,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        user_pin: user.user_pin,
        role_id: user.role_id,
        role: user.role,
        company_id: user.company_id,
        branch_id: user.branch_id,
      },
      token,
    });
  } catch (e) {
    next(e);
  }
};
