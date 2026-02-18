// api/[...path].ts  (recommended)
import app from "../backend/src/app"

export default function handler(req: any, res: any) {
  if (req.url?.startsWith("/api")) {
    req.url = req.url.replace(/^\/api/, "")
  }
  return (app as any)(req, res)
}
