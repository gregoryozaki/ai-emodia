import { Router } from "express"

import { createTextEmotionRecordController } from "../controllers/emotion-record.controller.js"
import {
  redirectAnalysisPage,
  renderAboutPage,
  renderDashboardPage,
  renderHomePage,
  renderNewAnalysisPage,
  renderProfilePage,
  renderReportsPage
} from "../controllers/web.controller.js"
import { ensureAuthenticated } from "../middlewares/auth.middleware.js"

const webRoutes = Router()

webRoutes.get("/", renderHomePage)
webRoutes.get("/sobre", renderAboutPage)

webRoutes.get("/analises", ensureAuthenticated, redirectAnalysisPage)
webRoutes.get("/dashboard", ensureAuthenticated, renderDashboardPage)
webRoutes.get("/analises/nova", ensureAuthenticated, renderNewAnalysisPage)
webRoutes.post(
  "/analises/registros",
  ensureAuthenticated,
  createTextEmotionRecordController
)
webRoutes.get("/relatorios", ensureAuthenticated, renderReportsPage)
webRoutes.get("/perfil", ensureAuthenticated, renderProfilePage)

export default webRoutes
