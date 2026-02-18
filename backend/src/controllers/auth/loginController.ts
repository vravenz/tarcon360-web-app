import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { findUserByEmailOrPin } from '../../models/user/userModel';
import { generateToken } from '../../utils/jwtUtils';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ error: "Email/PIN and password are required" });
      return;
    }

    const user = await findUserByEmailOrPin(identifier);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Consolidate account status checks
    if (!user.is_active || user.is_dormant || user.is_deleted) {
      res.status(403).json({ error: "Access denied. Your account does not have the proper status for login." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Check if all required user data is present
    if (user.id === undefined || user.role === undefined || user.company_id === undefined) {
      res.status(500).json({ error: "Essential user data (ID, role, or company ID) is missing" });
      return;
    }

    const tokenPayload = {
      id: user.id,
      role: user.role,
      company_id: user.company_id,
      branch_id: user.branch_id ?? 0,  // Provide a default value if branch_id is undefined
    };

    const token = generateToken(tokenPayload);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        user_pin: user.user_pin,
        role: user.role,
        company_id: user.company_id,
        branch_id: user.branch_id
      },
      token
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};
