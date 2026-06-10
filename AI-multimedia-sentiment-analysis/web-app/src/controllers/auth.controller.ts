import type { Request, Response } from "express"

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

export {
  renderLoginPage,
  renderRegisterPage,
  renderForgotPasswordPage,
  renderResetPasswordPage
}
