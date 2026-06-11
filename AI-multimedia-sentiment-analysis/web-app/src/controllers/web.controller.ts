import type { Request, Response } from "express"

import {
  getEmotionDashboardSummary,
  listRecentEmotionRecords
} from "../services/emotion-record.service.js"

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

const renderAnalysisPage = async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  const records = await listRecentEmotionRecords(userId)
  const summary = await getEmotionDashboardSummary(userId)

  res.render("analyses", {
    title: "Emodia | Análises",
    records,
    summary,
    success: req.query.created === "1"
  })
}

export { renderHomePage, renderAboutPage, renderAnalysisPage }
