import { Router } from "express"
import {
  renderAboutPage,
  renderAnalysisPage,
  renderHomePage
} from "../controllers/web.controller.js"

const webRoutes = Router()

webRoutes.get("/", renderHomePage)
webRoutes.get("/analises", renderAnalysisPage)
webRoutes.get("/sobre", renderAboutPage)

export default webRoutes
