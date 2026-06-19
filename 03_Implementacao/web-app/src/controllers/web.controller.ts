import type { Request, Response } from "express"

import {
  getEmotionDashboardSummary,
  getEmotionHistory,
  getEmotionRecordDetails,
  getEmotionReports
} from "../services/emotion-record.service.js"
import { getUserProfile } from "../services/user.service.js"
import {
  emotionHistoryQuerySchema,
  emotionRecordIdParamsSchema,
  getValidationMessage
} from "../validations/emotion-record.validation.js"

const renderHomePage = (_req: Request, res: Response) => {
  res.render("home", {
    title: "Emodia | Início",
    useEmotionGauge: true
  })
}

const renderAboutPage = (_req: Request, res: Response) => {
  res.render("about", {
    title: "Emodia | Sobre"
  })
}

const redirectAnalysisPage = (_req: Request, res: Response) => {
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

const renderNewAnalysisPage = (_req: Request, res: Response) => {
  res.render("app/new-analysis", {
    title: "Emodia | Nova análise",
    useNewAnalysisTabs: true,
    useAudioRecorder: true,
    useVideoRecorder: true,
    useAnalysisSubmitLoading: true
  })
}

const renderHistoryPage = async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  const validation = emotionHistoryQuerySchema.safeParse(req.query)

  if (!validation.success) {
    const history = await getEmotionHistory(userId, {
      page: 1
    })

    res.status(400).render("app/history", {
      title: "Emodia | Histórico",
      history,
      error: getValidationMessage(validation.error)
    })
    return
  }

  const history = await getEmotionHistory(userId, validation.data)

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

  const validation = emotionRecordIdParamsSchema.safeParse(req.params)

  if (!validation.success) {
    res.status(400).send(getValidationMessage(validation.error))
    return
  }

  const { id: recordId } = validation.data

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
