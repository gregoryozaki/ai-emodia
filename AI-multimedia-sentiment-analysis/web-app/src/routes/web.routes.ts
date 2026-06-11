import { Router } from "express"

import { createTextEmotionRecordController } from "../controllers/emotion-record.controller.js"
import {
  renderAboutPage,
  renderAnalysisPage,
  renderHomePage
} from "../controllers/web.controller.js"
import { ensureAuthenticated } from "../middlewares/auth.middleware.js"

const webRoutes = Router()

webRoutes.get("/", renderHomePage)
webRoutes.get("/sobre", renderAboutPage)

webRoutes.get("/analises", ensureAuthenticated, renderAnalysisPage)
webRoutes.post(
  "/analises/registros",
  ensureAuthenticated,
  createTextEmotionRecordController
)

export default webRoutes
