// src/controllers/superAdmin/superAdminDashboardController.ts
import type { RequestHandler } from "express";
import * as SuperAdminDashboardModel from "../../models/superAdmin/superAdminDashboardModel";

export const getDashboardSummary: RequestHandler = async (req, res) => {
  try {
    const summary = await SuperAdminDashboardModel.getDashboardSummary();
    res.status(200).json({ ok: true, data: summary });
    return;
  } catch (error: any) {
    console.error("Failed to fetch super admin dashboard summary:", error);
    res
      .status(500)
      .json({ ok: false, error: "Internal server error", details: error?.message });
    return;
  }
};
