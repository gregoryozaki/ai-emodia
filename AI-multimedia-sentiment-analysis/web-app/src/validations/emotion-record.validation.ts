import { z } from "zod"

const EMOTION_TEXT_MIN_LENGTH = 10
const EMOTION_TEXT_MAX_LENGTH = 5000

const contentSchema = z.preprocess(
  (value) => (typeof value === "string" ? value : ""),
  z
    .string()
    .trim()
    .min(
      EMOTION_TEXT_MIN_LENGTH,
      `O relato deve ter pelo menos ${EMOTION_TEXT_MIN_LENGTH} caracteres.`
    )
    .max(
      EMOTION_TEXT_MAX_LENGTH,
      `O relato deve ter no máximo ${EMOTION_TEXT_MAX_LENGTH} caracteres.`
    )
)

const transcriptSchema = z.preprocess(
  (value) => (typeof value === "string" ? value : ""),
  z
    .string()
    .trim()
    .min(
      EMOTION_TEXT_MIN_LENGTH,
      `A transcrição deve ter pelo menos ${EMOTION_TEXT_MIN_LENGTH} caracteres.`
    )
    .max(
      EMOTION_TEXT_MAX_LENGTH,
      `A transcrição deve ter no máximo ${EMOTION_TEXT_MAX_LENGTH} caracteres.`
    )
)

const createTextEmotionRecordSchema = z.object({
  content: contentSchema
})

const createTranscriptEmotionRecordSchema = z.object({
  transcript: transcriptSchema,
  inputMode: z.enum(["AUDIO", "VIDEO"])
})

const getValidationMessage = (error: z.ZodError) => {
  const firstIssue = error.issues[0]

  if (firstIssue?.path[0] === "inputMode") {
    return "O tipo de entrada deve ser áudio ou vídeo."
  }

  return firstIssue?.message ?? "Os dados enviados são inválidos."
}

const parseEmotionContent = (value: unknown) => {
  const result = contentSchema.safeParse(value)

  if (!result.success) {
    throw new Error(getValidationMessage(result.error))
  }

  return result.data
}

const parseEmotionTranscript = (value: unknown) => {
  const result = transcriptSchema.safeParse(value)

  if (!result.success) {
    throw new Error(getValidationMessage(result.error))
  }

  return result.data
}

export {
  EMOTION_TEXT_MAX_LENGTH,
  EMOTION_TEXT_MIN_LENGTH,
  createTextEmotionRecordSchema,
  createTranscriptEmotionRecordSchema,
  getValidationMessage,
  parseEmotionContent,
  parseEmotionTranscript
}
