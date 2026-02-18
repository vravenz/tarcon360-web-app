import { Router } from "express"
import authRoutes from "./auth.routes"
import trackingRoutes from "./tracking.routes"
import rosterRoutes from "./roster.routes"
import checkCallsRoutes from "./check-calls.routes"
import checkpointScanRoutes from "./checkpoint-scan.routes"

const router = Router()

router.use("/auth", authRoutes)
router.use("/tracking", trackingRoutes)
router.use("/roster", rosterRoutes)

router.use("/check-calls", checkCallsRoutes)
router.use("/checkpoint-scan", checkpointScanRoutes)

export default router
