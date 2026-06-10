import type { Request, Response } from "express"

import { loginUser, registerUser } from "../services/auth.service.js"

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

export {
  renderLoginPage,
  renderRegisterPage,
  renderForgotPasswordPage,
  renderResetPasswordPage,
  registerUserController,
  loginUserController,
  logoutUserController
}
