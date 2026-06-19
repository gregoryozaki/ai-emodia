import type { Request, Response } from "express"

import {
  removeTemporaryAudio,
  transcribeAudio
} from "../services/transcription.service.js"

const transcribeAudioController = async (req: Request, res: Response) => {
  if (!req.session.userId) {
    res.status(401).json({
      message: "Usuário não autenticado."
    })
    return
  }

  const audioFile = req.file

  if (!audioFile) {
    res.status(400).json({
      message: "Nenhum áudio foi enviado."
    })
    return
  }

  try {
    const transcription = await transcribeAudio(audioFile.path)

    res.json({
      transcript: transcription.transcript,
      language: transcription.language,
      duration: transcription.duration,
      model: transcription.model,
      device: transcription.device
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao transcrever áudio."

    res.status(500).json({
      message
    })
  } finally {
    await removeTemporaryAudio(audioFile.path)
  }
}

export { transcribeAudioController }
