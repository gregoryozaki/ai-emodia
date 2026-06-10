import { Router } from "express"

import webRoutes from "./web.routes.js"
import apiRoutes from "./api.routes.js"

const routes = Router()

routes.use("/", webRoutes)
routes.use("/api", apiRoutes)

export default routes
