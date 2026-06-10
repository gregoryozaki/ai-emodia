import type { Request, Response } from "express"

const renderLoginPage = (req: Request, res: Response) => {
  res.render("auth/login", {
    title: "Emodia | Entrar"
  })
}

const renderRegisterPage = (req: Request, res: Response) => {
  res.render("auth/register", {
    title: "Emodia | Criar conta"
  })
}

export { renderLoginPage, renderRegisterPage }
