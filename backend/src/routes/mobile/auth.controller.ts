import type { Request, Response } from "express"
import bcrypt from "bcryptjs"
import { findUserByEmailOrPin } from "../../models/user/userModel"
import { generateToken } from "../../utils/jwtUtils"

const ALLOWED_MOBILE_ROLES = ["staff", "guard", "employee"] as const

export async function mobileLogin(req: Request, res: Response): Promise<void> {
  try {
    const { identifier, password } = req.body ?? {}

    if (!identifier || !password) {
      res.status(400).json({ error: "Email/PIN and password are required" })
      return
    }

    const user = await findUserByEmailOrPin(String(identifier))

    if (!user) {
      res.status(404).json({ error: "User not found" })
      return
    }

    // Account status checks
    if (!user.is_active || user.is_dormant || user.is_deleted) {
      res.status(403).json({
        error: "Your account is inactive or dormant. Contact admin.",
      })
      return
    }

    if (!user.password) {
      res.status(500).json({ error: "User password not found" })
      return
    }

    const isMatch = await bcrypt.compare(String(password), user.password)
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials" })
      return
    }

    // IMPORTANT: remove `source` unless you add it to TokenPayload type
    const token = generateToken({
      id: user.id!,
      role: user.role,
      company_id: user.company_id,
      branch_id: user.branch_id ?? 0,
    })

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        branch_id: user.branch_id,
        user_pin: user.user_pin,
      },
      token,
    })
  } catch (err) {
    console.error("Mobile login error:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}

// makes TS always treat file as a module, even in weird configs
export {}
