import type { Request, Response } from "express"

import {
  createTextEmotionRecord,
  listRecentEmotionRecords
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
    await createTextEmotionRecord({
      userId,
      content: req.body.content
    })

    res.redirect("/analises?created=1#history")
  } catch (error) {
    const records = await listRecentEmotionRecords(userId)

    const message =
      error instanceof Error ? error.message : "Erro ao registrar emoção."

    res.status(400).render("analyses", {
      title: "Emodia | Análises",
      error: message,
      records,
      formData: req.body
    })
  }
}

export { createTextEmotionRecordController }
