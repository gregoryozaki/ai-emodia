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

const transcribeAudioRemotely = async (
  audioPath: string
): Promise<TranscriptionResult> => {
  if (!env.EMODIA_TRANSCRIPTION_REMOTE_URL) {
    throw new Error("URL de transcrição remota não configurada.")
  }

  throw new Error("Transcrição remota ainda não implementada.")
}

const transcribeAudio = async (
  audioPath: string
): Promise<TranscriptionResult> => {
  if (env.EMODIA_TRANSCRIPTION_MODE === "disabled") {
    throw new Error(
      "Transcrição automática indisponível neste ambiente. Preencha a transcrição manualmente."
    )
  }

  if (env.EMODIA_TRANSCRIPTION_MODE === "remote") {
    return transcribeAudioRemotely(audioPath)
  }

  return transcribeAudioLocally(audioPath)
}

const removeTemporaryAudio = async (audioPath: string) => {
  await fs.unlink(audioPath).catch(() => undefined)
}

export { removeTemporaryAudio, transcribeAudio }

export type { TranscriptionResult }
