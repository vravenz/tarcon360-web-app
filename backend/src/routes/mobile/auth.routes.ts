import { Router } from "express"
import { mobileLogin } from "./auth.controller"

const router = Router()

router.post("/login", mobileLogin)

export default router
