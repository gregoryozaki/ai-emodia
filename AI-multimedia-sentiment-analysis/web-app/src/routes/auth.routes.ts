import { Router } from "express"

import {
  loginUserController,
  logoutUserController,
  registerUserController,
  renderForgotPasswordPage,
  renderLoginPage,
  renderRegisterPage,
  renderResetPasswordPage
} from "../controllers/auth.controller.js"

const authRoutes = Router()

authRoutes.get("/login", renderLoginPage)
authRoutes.post("/login", loginUserController)

authRoutes.get("/cadastro", renderRegisterPage)
authRoutes.post("/cadastro", registerUserController)

authRoutes.post("/logout", logoutUserController)

authRoutes.get("/recuperar-senha", renderForgotPasswordPage)
authRoutes.get("/redefinir-senha", renderResetPasswordPage)

export default authRoutes
