import type { Request, Response } from "express"

import {
  getEmotionDashboardSummary,
  listRecentEmotionRecords
} from "../services/emotion-record.service.js"

import { getUserProfile } from "../services/user.service.js"

const renderHomePage = (req: Request, res: Response) => {
  res.render("home", {
    title: "Emodia | Início",
    useEmotionGauge: true
  })
}

const renderAboutPage = (req: Request, res: Response) => {
  res.render("about", {
    title: "Emodia | Sobre"
  })
}

const redirectAnalysisPage = (req: Request, res: Response) => {
  res.redirect("/dashboard")
}

const renderDashboardPage = async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  const records = await listRecentEmotionRecords(userId)
  const summary = await getEmotionDashboardSummary(userId)

  res.render("app/dashboard", {
    title: "Emodia | Dashboard",
    records,
    summary,
    success: req.query.created === "1"
  })
}

const renderNewAnalysisPage = (req: Request, res: Response) => {
  res.render("app/new-analysis", {
    title: "Emodia | Nova análise"
  })
}

const renderReportsPage = (req: Request, res: Response) => {
  res.render("app/reports", {
    title: "Emodia | Relatórios"
  })
}

const renderProfilePage = async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  const profile = await getUserProfile(userId)

  res.render("app/profile", {
    title: "Emodia | Perfil",
    profile,
    usePasswordToggle: true,
    useAvatarPreview: true,
    success:
      req.query.updated === "1"
        ? "Dados pessoais atualizados com sucesso."
        : req.query.avatar === "1"
          ? "Foto de perfil atualizada com sucesso."
          : req.query.password === "1"
            ? "Senha alterada com sucesso."
            : undefined
  })
}

export {
  renderHomePage,
  renderAboutPage,
  redirectAnalysisPage,
  renderDashboardPage,
  renderNewAnalysisPage,
  renderReportsPage,
  renderProfilePage
}
