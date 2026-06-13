import fs from "node:fs/promises"

import { env } from "../config/env.js"
import { transcribeAudioLocally } from "./local-transcription.service.js"

type TranscriptionResult = {
  transcript: string
  language?: string
  duration?: number
  model?: string
  device?: string
}

const transcribeAudio = async (
  audioPath: string
): Promise<TranscriptionResult> => {
  if (env.EMODIA_TRANSCRIPTION_MODE === "disabled") {
    throw new Error(
      "Transcrição automática indisponível neste ambiente. Preencha a transcrição manualmente."
    )
  }

  return transcribeAudioLocally(audioPath)
}

const removeTemporaryAudio = async (audioPath: string) => {
  await fs.unlink(audioPath).catch(() => undefined)
}

export { removeTemporaryAudio, transcribeAudio }

export type { TranscriptionResult }
