import { Router } from "express"

import {
  loginUserController,
  logoutUserController,
  registerUserController,
  renderForgotPasswordPage,
  renderLoginPage,
  renderRegisterPage,
  renderResetPasswordPage,
  requestPasswordRecoveryController,
  resetPasswordController
} from "../controllers/auth.controller.js"

const authRoutes = Router()

authRoutes.get("/login", renderLoginPage)
authRoutes.post("/login", loginUserController)

authRoutes.get("/cadastro", renderRegisterPage)
authRoutes.post("/cadastro", registerUserController)

authRoutes.get("/recuperar-senha", renderForgotPasswordPage)
authRoutes.post("/recuperar-senha", requestPasswordRecoveryController)

authRoutes.get("/redefinir-senha/:token", renderResetPasswordPage)
authRoutes.post("/redefinir-senha/:token", resetPasswordController)

authRoutes.post("/logout", logoutUserController)

export { authRoutes }
