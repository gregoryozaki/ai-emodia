import { Router } from "express"

import webRoutes from "./web.routes.js"
import apiRoutes from "./api.routes.js"
import { authRoutes } from "./auth.routes.js"

const routes = Router()

routes.use("/", webRoutes)
routes.use("/", authRoutes)
routes.use("/api", apiRoutes)

export default routes
