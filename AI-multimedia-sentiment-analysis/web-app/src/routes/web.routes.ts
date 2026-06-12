import { Router } from "express"

import { createTextEmotionRecordController } from "../controllers/emotion-record.controller.js"
import {
  redirectAnalysisPage,
  renderAboutPage,
  renderDashboardPage,
  renderEmotionRecordDetailsPage,
  renderHistoryPage,
  renderHomePage,
  renderNewAnalysisPage,
  renderProfilePage,
  renderReportsPage
} from "../controllers/web.controller.js"
import { ensureAuthenticated } from "../middlewares/auth.middleware.js"
import {
  deleteProfileController,
  updateAvatarController,
  updatePasswordController,
  updatePersonalDataController
} from "../controllers/profile.controller.js"
import { uploadAvatar } from "../middlewares/upload.middleware.js"
import { exportEmotionReportPdfController } from "../controllers/report.controller.js"

const webRoutes = Router()

webRoutes.get("/", renderHomePage)
webRoutes.get("/sobre", renderAboutPage)

webRoutes.get("/analises", ensureAuthenticated, redirectAnalysisPage)
webRoutes.get("/dashboard", ensureAuthenticated, renderDashboardPage)
webRoutes.get("/analises/nova", ensureAuthenticated, renderNewAnalysisPage)
webRoutes.get("/historico", ensureAuthenticated, renderHistoryPage)
webRoutes.get(
  "/analises/:id",
  ensureAuthenticated,
  renderEmotionRecordDetailsPage
)
webRoutes.get("/relatorios", ensureAuthenticated, renderReportsPage)
webRoutes.get(
  "/relatorios/pdf",
  ensureAuthenticated,
  exportEmotionReportPdfController
)
webRoutes.post(
  "/analises/registros",
  ensureAuthenticated,
  createTextEmotionRecordController
)

webRoutes.get("/perfil", ensureAuthenticated, renderProfilePage)
webRoutes.post(
  "/perfil/dados",
  ensureAuthenticated,
  updatePersonalDataController
)
webRoutes.post("/perfil/senha", ensureAuthenticated, updatePasswordController)

webRoutes.post(
  "/perfil/avatar",
  ensureAuthenticated,
  uploadAvatar.single("avatar"),
  updateAvatarController
)

webRoutes.post("/perfil/excluir", ensureAuthenticated, deleteProfileController)

export default webRoutes
