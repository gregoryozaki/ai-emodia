import { Router } from "express"

import {
  renderLoginPage,
  renderRegisterPage,
  renderForgotPasswordPage,
  renderResetPasswordPage,
  registerUserController
} from "../controllers/auth.controller.js"

const authRoutes = Router()

authRoutes.get("/login", renderLoginPage)
authRoutes.get("/cadastro", renderRegisterPage)
authRoutes.post("/cadastro", registerUserController)

authRoutes.get("/recuperar-senha", renderForgotPasswordPage)
authRoutes.get("/redefinir-senha", renderResetPasswordPage)

export default authRoutes
