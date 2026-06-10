import { Router } from "express"

import {
  renderLoginPage,
  renderRegisterPage
} from "../controllers/auth.controller.js"

const authRoutes = Router()

authRoutes.get("/login", renderLoginPage)
authRoutes.get("/cadastro", renderRegisterPage)

export default authRoutes
