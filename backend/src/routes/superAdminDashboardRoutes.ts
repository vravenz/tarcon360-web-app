// src/routes/superAdminDashboardRoutes.ts
import express from "express";
import * as superAdminDashboardController from "../controllers/superAdmin/superAdminDashboardController";

const router = express.Router();

/**
 * Super Admin Dashboard (clean summary)
 * GET /api/super-admin/dashboard/summary
 */
router.get("/dashboard/summary", superAdminDashboardController.getDashboardSummary);

export default router;
