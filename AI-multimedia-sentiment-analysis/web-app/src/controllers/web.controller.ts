import type { Request, Response } from "express"

import {
  getEmotionDashboardSummary,
  getEmotionHistory,
  getEmotionRecordDetails,
  getEmotionReports
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

  const dashboard = await getEmotionDashboardSummary(userId)

  res.render("app/dashboard", {
    title: "Emodia | Dashboard",
    dashboard,
    useEmotionTemporalChart: true,
    success:
      req.query.created === "1"
        ? "Análise emocional registrada com sucesso."
        : undefined
  })
}

const renderNewAnalysisPage = (req: Request, res: Response) => {
  res.render("app/new-analysis", {
    title: "Emodia | Nova análise",
    useNewAnalysisTabs: true,
    useAudioRecorder: true
  })
}

const renderHistoryPage = async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  const historyQuery = {
    ...(req.query.emotion ? { emotion: req.query.emotion.toString() } : {}),
    ...(req.query.startDate
      ? { startDate: req.query.startDate.toString() }
      : {}),
    ...(req.query.endDate ? { endDate: req.query.endDate.toString() } : {}),
    ...(req.query.page ? { page: req.query.page.toString() } : {})
  }

  const history = await getEmotionHistory(userId, historyQuery)

  res.render("app/history", {
    title: "Emodia | Histórico",
    history
  })
}

const renderEmotionRecordDetailsPage = async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  const recordIdParam = req.params.id

  if (!recordIdParam || Array.isArray(recordIdParam)) {
    res.redirect("/historico")
    return
  }

  const recordId = recordIdParam

  try {
    const record = await getEmotionRecordDetails(userId, recordId)

    res.render("app/analysis-detail", {
      title: "Emodia | Detalhes da análise",
      record
    })
  } catch {
    res.redirect("/historico")
  }
}

const renderReportsPage = async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  const reports = await getEmotionReports(userId)

  res.render("app/reports", {
    title: "Emodia | Relatórios",
    reports
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
  redirectAnalysisPage,
  renderAboutPage,
  renderDashboardPage,
  renderEmotionRecordDetailsPage,
  renderHistoryPage,
  renderHomePage,
  renderNewAnalysisPage,
  renderProfilePage,
  renderReportsPage
}
