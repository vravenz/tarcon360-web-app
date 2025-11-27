// src/utils/jwtUtils.ts
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: number;
  role: string;
  company_id: number;
  branch_id: number;
}

export const generateToken = (payload: Partial<TokenPayload>): string => {
  if (!payload.id || !payload.role || !payload.company_id || !payload.branch_id) {
    throw new Error("Token payload is missing required fields");
  }

  return jwt.sign(payload as TokenPayload, process.env.JWT_SECRET!, { expiresIn: '1h' });
};