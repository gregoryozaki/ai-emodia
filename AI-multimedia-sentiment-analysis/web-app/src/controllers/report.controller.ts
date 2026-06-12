import type { Request, Response } from "express"

import {
  getEmotionReportByPeriod,
  type ReportPeriod
} from "../services/emotion-record.service.js"
import { generateEmotionReportPdf } from "../services/report-pdf.service.js"

const normalizePeriod = (period?: string): ReportPeriod => {
  return period === "monthly" ? "monthly" : "weekly"
}

const exportEmotionReportPdfController = async (
  req: Request,
  res: Response
) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  const period = normalizePeriod(req.query.period?.toString())
  const report = await getEmotionReportByPeriod(userId, period)
  const pdfBuffer = await generateEmotionReportPdf(report)

  const fileName =
    period === "monthly"
      ? "relatorio-mensal-emodia.pdf"
      : "relatorio-semanal-emodia.pdf"

  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`)
  res.send(pdfBuffer)
}

export { exportEmotionReportPdfController }
