import { Router } from "express"

import { ensureAuthenticated } from "../middlewares/auth.middleware.js"

import {
  renderAboutPage,
  renderAnalysisPage,
  renderHomePage
} from "../controllers/web.controller.js"

const webRoutes = Router()

webRoutes.get("/", renderHomePage)
webRoutes.get("/sobre", renderAboutPage)
webRoutes.get("/analises", ensureAuthenticated, renderAnalysisPage)

export default webRoutes
