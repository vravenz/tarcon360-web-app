// backend/src/app.ts
import express, { Express, Request, Response, NextFunction } from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"

// routes
import authRoutes from "./routes/authRoutes"
import jobRoutes from "./routes/jobRoutes"
import applicantRoutes from "./routes/applicantRoutes"
import employeeRoutes from "./routes/employeeRoutes"
import branchRoutes from "./routes/branchRoutes"
import guardGroupRoutes from "./routes/guardGroupRoutes"
import subcontractorRoutes from "./routes/subcontractorRoutes"
import subcontractorCompanyRoutes from "./routes/subcontractorCompanyRoutes"
import clientRoutes from "./routes/clientRoutes"
import sitesRoutes from "./routes/siteRoutes"
import roasterRoutes from "./routes/roasterRoutes"
import siteCheckpointRoutes from "./routes/siteCheckpointRoutes"
import siteCheckCallRoutes from "./routes/siteCheckCallRoutes"
import checkCallRoutes from "./routes/rosterShiftCheckCallRoutes"
import checkpointRoutes from "./routes/rosterShiftCheckpointRoutes"
import telemetryRoutes from "./routes/telemetryRoutes"
import etaRoutes from "./routes/etaRoutes"
import bookOnOffRoutes from "./routes/bookOnOffRoutes"
import invoiceRoutes from "./routes/invoiceRoutes"
import statsRoutes from "./routes/statsRoutes"
import mobileRoutes from "./routes/mobile"
import superAdminDashboardRoutes from "./routes/superAdminDashboardRoutes"

dotenv.config()

// timezone
process.env.TZ = process.env.APP_TIMEZONE || "Asia/Karachi"

const app: Express = express()

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // server-to-server / curl
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, true); // ✅ allow Vercel same-origin (no CORS needed)
    },
    credentials: true,
  })
);

app.use((req, _res, next) => {
  console.log("INCOMING:", req.method, req.url);
  next();
});


app.use(express.json())

// extract userId middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  let userId: number | undefined

  if (req.headers["x-user-id"]) {
    userId = parseInt(req.headers["x-user-id"] as string, 10)
  } else if ((req.body as any)?.user_id) {
    userId = parseInt((req.body as any).user_id, 10)
  }

  if (userId !== undefined && !isNaN(userId)) {
    ;(req as any).userId = userId
  }

  next()
})

// ✅ KEEP your existing /api routes (works same on localhost + Vercel)
app.use("/api/auth", authRoutes)
app.use("/api/jobs", jobRoutes)
app.use("/api/applicants", applicantRoutes)
app.use("/api", employeeRoutes)
app.use("/api/branches", branchRoutes)
app.use("/api", guardGroupRoutes)
app.use("/api/subcontractors", subcontractorRoutes)
app.use("/api/subcontractor-company", subcontractorCompanyRoutes)
app.use("/api", clientRoutes)
app.use("/api", sitesRoutes)
app.use("/api/sites", siteCheckpointRoutes)
app.use("/api", roasterRoutes)
app.use("/api/sites", siteCheckCallRoutes)
app.use("/api", checkCallRoutes)
app.use("/api", checkpointRoutes)
app.use("/api/tracking", telemetryRoutes)
app.use("/api/tracking", etaRoutes)
app.use("/api/tracking", bookOnOffRoutes)
app.use("/api", invoiceRoutes)
app.use("/api/stats", statsRoutes)
app.use("/api/super-admin", superAdminDashboardRoutes)
app.use("/api/mobile", mobileRoutes)

// ✅ uploads only in LOCAL dev (Vercel disk is temporary)
if (process.env.NODE_ENV !== "production") {
  app.use("/uploads", express.static(path.join(__dirname, "../src/uploads")))
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    node_env: process.env.NODE_ENV,
    has_database_url: !!process.env.DATABASE_URL,
  })
})

app.get("/api/db-check", async (_req, res) => {
  try {
    const { getPool } = await import("./config/database") // adjust path if needed
    const pool = getPool()
    const r1 = await pool().query("select current_database() db, current_user usr, current_schema() schema")
    const r2 = await pool().query("select to_regclass('public.users') as users_table")
    res.json({ ok: true, info: r1.rows[0], tables: r2.rows[0] })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) })
  }
})


app.get("/", (_req, res) => res.status(200).send("Tarcon360 API running"))

export default app
