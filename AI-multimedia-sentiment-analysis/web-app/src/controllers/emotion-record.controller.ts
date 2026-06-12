import type { Request, Response } from "express"

import {
  createTextEmotionRecord,
  createTranscriptEmotionRecord
} from "../services/emotion-record.service.js"

const createTextEmotionRecordController = async (
  req: Request,
  res: Response
) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  try {
    const record = await createTextEmotionRecord({
      userId,
      content: req.body.content
    })

    if (record.riskLevel === "HIGH" || record.riskLevel === "CRITICAL") {
      res.redirect(`/analises/${record.id}?risk=1`)
      return
    }

    res.redirect("/dashboard?created=1")
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao registrar emoção."

    res.status(400).render("app/new-analysis", {
      title: "Emodia | Nova análise",
      error: message,
      formData: req.body
    })
  }
}

const createTranscriptEmotionRecordController = async (
  req: Request,
  res: Response
) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  try {
    const inputMode = req.body.inputMode === "VIDEO" ? "VIDEO" : "AUDIO"

    const record = await createTranscriptEmotionRecord({
      userId,
      inputMode,
      transcript: req.body.transcript
    })

    if (record.riskLevel === "HIGH" || record.riskLevel === "CRITICAL") {
      res.redirect(`/analises/${record.id}?risk=1`)
      return
    }

    res.redirect("/dashboard?created=1")
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao registrar emoção."

    res.status(400).render("app/new-analysis", {
      title: "Emodia | Nova análise",
      error: message,
      formData: req.body
    })
  }
}

export {
  createTextEmotionRecordController,
  createTranscriptEmotionRecordController
}
