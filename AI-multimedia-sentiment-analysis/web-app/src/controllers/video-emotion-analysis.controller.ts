import fs from "node:fs/promises"

import type { Request, Response } from "express"

import { analyzeVideoEmotion } from "../services/video-emotion-analysis.service.js"

const removeTemporaryVideo = async (videoPath: string) => {
  await fs.unlink(videoPath).catch(() => undefined)
}

const analyzeVideoEmotionController = async (req: Request, res: Response) => {
  if (!req.session.userId) {
    res.status(401).json({
      message: "Usuário não autenticado."
    })
    return
  }

  const videoFile = req.file

  if (!videoFile) {
    res.status(400).json({
      message: "Nenhum vídeo foi enviado."
    })
    return
  }

  try {
    const visualAnalysis = await analyzeVideoEmotion(videoFile.path)

    res.json(visualAnalysis)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao analisar emoção facial no vídeo."

    res.status(500).json({
      message
    })
  } finally {
    await removeTemporaryVideo(videoFile.path)
  }
}

export { analyzeVideoEmotionController }
