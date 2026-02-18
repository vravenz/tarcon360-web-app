import express from "express"
import {
  addSite,
  fetchSite,
  fetchAllSites,
  fetchSitesByClient,

  // NEW
  listSiteGuards,
  setSiteGuardBlock,
} from "../controllers/sites/sitesController"

const router = express.Router()

router.post("/sites", addSite)
router.get("/sites/:siteId", fetchSite)
router.get("/sites", fetchAllSites)
router.get("/clients/:clientId/sites", fetchSitesByClient)

// NEW: site-level ban/unban
router.get("/sites/:siteId/guards", listSiteGuards)
router.patch("/sites/:siteId/guards/:applicantId/block", setSiteGuardBlock)

export default router
