// api/[...path].ts  (recommended)
import app from "../backend/src/app";

export default function handler(req: any, res: any) {
  // ✅ Normalize URL so Express routes with "/api/..." work on Vercel
  // Sometimes the function receives "/auth/login" instead of "/api/auth/login"
  if (req.url && !req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? "" : "/") + req.url
  }

  return (app as any)(req, res)
}