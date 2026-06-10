import type { Request, Response } from "express"

import { registerUser } from "../services/auth.service.js"

const renderLoginPage = (req: Request, res: Response) => {
  res.render("auth/login", {
    title: "Emodia | Entrar",
    usePasswordToggle: true
  })
}

const renderRegisterPage = (req: Request, res: Response) => {
  res.render("auth/register", {
    title: "Emodia | Criar conta",
    usePasswordToggle: true,
    useRegisterValidation: true
  })
}

const renderForgotPasswordPage = (req: Request, res: Response) => {
  res.render("auth/forgot-password", {
    title: "Emodia | Recuperar senha"
  })
}

const renderResetPasswordPage = (req: Request, res: Response) => {
  res.render("auth/reset-password", {
    title: "Emodia | Redefinir senha",
    usePasswordToggle: true
  })
}

const registerUserController = async (req: Request, res: Response) => {
  try {
    await registerUser(req.body)

    res.redirect("/login")
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar conta."

    res.status(400).render("auth/register", {
      title: "Emodia | Criar conta",
      usePasswordToggle: true,
      useRegisterValidation: true,
      error: message,
      formData: req.body
    })
  }
}

export {
  renderLoginPage,
  renderRegisterPage,
  renderForgotPasswordPage,
  renderResetPasswordPage,
  registerUserController
}
