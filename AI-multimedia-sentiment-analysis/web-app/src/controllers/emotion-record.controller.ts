import type { Request, Response } from "express"

import { createTextEmotionRecord } from "../services/emotion-record.service.js"

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
    await createTextEmotionRecord({
      userId,
      content: req.body.content
    })

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

export { createTextEmotionRecordController }
