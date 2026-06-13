import type { Request, Response } from "express"

import { loginUser, registerUser } from "../services/auth.service.js"
import {
  requestPasswordRecovery,
  resetPassword
} from "../services/password-recovery.service.js"

const regenerateSession = (req: Request) => {
  return new Promise<void>((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

const saveSession = (req: Request) => {
  return new Promise<void>((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

const destroySession = (req: Request) => {
  return new Promise<void>((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

const renderLoginPage = (req: Request, res: Response) => {
  res.render("auth/login", {
    title: "Emodia | Entrar",
    usePasswordToggle: true,
    success:
      req.query.passwordReset === "1"
        ? "Senha redefinida com sucesso. Faça login com a nova senha."
        : undefined
  })
}

const renderRegisterPage = (_req: Request, res: Response) => {
  res.render("auth/register", {
    title: "Emodia | Criar conta",
    usePasswordToggle: true,
    useRegisterValidation: true
  })
}

const renderForgotPasswordPage = (req: Request, res: Response) => {
  res.render("auth/forgot-password", {
    title: "Emodia | Recuperar senha",
    success:
      req.query.sent === "1"
        ? "Se o e-mail estiver cadastrado, enviaremos um link de recuperação."
        : undefined
  })
}

const renderResetPasswordPage = (req: Request, res: Response) => {
  const tokenParam = req.params.token

  if (!tokenParam || Array.isArray(tokenParam)) {
    res.redirect("/recuperar-senha")
    return
  }

  res.render("auth/reset-password", {
    title: "Emodia | Redefinir senha",
    token: tokenParam,
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

const loginUserController = async (req: Request, res: Response) => {
  try {
    const user = await loginUser(req.body)

    await regenerateSession(req)

    req.session.userId = user.id

    await saveSession(req)

    res.redirect("/analises")
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao fazer login."

    res.status(400).render("auth/login", {
      title: "Emodia | Entrar",
      usePasswordToggle: true,
      error: message,
      formData: req.body
    })
  }
}

const logoutUserController = async (req: Request, res: Response) => {
  await destroySession(req)

  res.clearCookie("emodia.sid")
  res.redirect("/login")
}

const requestPasswordRecoveryController = async (
  req: Request,
  res: Response
) => {
  try {
    await requestPasswordRecovery(req.body.email)

    res.redirect("/recuperar-senha?sent=1")
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao solicitar recuperação de senha."

    res.status(400).render("auth/forgot-password", {
      title: "Emodia | Recuperar senha",
      error: message,
      formData: req.body
    })
  }
}

const resetPasswordController = async (req: Request, res: Response) => {
  const tokenParam = req.params.token

  if (!tokenParam || Array.isArray(tokenParam)) {
    res.redirect("/recuperar-senha")
    return
  }

  const token = tokenParam

  try {
    await resetPassword({
      token,
      newPassword: req.body.newPassword,
      confirmNewPassword: req.body.confirmNewPassword
    })

    res.redirect("/login?passwordReset=1")
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao redefinir senha."

    res.status(400).render("auth/reset-password", {
      title: "Emodia | Redefinir senha",
      token,
      usePasswordToggle: true,
      error: message
    })
  }
}

export {
  loginUserController,
  logoutUserController,
  registerUserController,
  renderForgotPasswordPage,
  renderLoginPage,
  renderRegisterPage,
  renderResetPasswordPage,
  requestPasswordRecoveryController,
  resetPasswordController
}
