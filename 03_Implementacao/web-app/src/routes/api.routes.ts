import { Router } from "express"

import { healthCheck } from "../controllers/api.controller.js"

const apiRoutes = Router()

apiRoutes.get("/health", healthCheck)

export default apiRoutes
