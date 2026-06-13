import { z } from "zod"

const EMOTION_TEXT_MIN_LENGTH = 10
const EMOTION_TEXT_MAX_LENGTH = 5000
const HISTORY_MAX_PAGE = 1000

const EMOTION_VALUES = [
  "ALEGRIA",
  "TRISTEZA",
  "RAIVA",
  "MEDO",
  "NOJO",
  "ANSIEDADE"
] as const

const REPORT_PERIOD_VALUES = ["weekly", "monthly"] as const

const normalizeRequiredText = (value: unknown) => {
  return typeof value === "string" ? value : ""
}

const normalizeOptionalQueryText = (value: unknown) => {
  if (typeof value !== "string") {
    return value
  }

  const normalizedValue = value.trim()

  return normalizedValue || undefined
}

const contentSchema = z.preprocess(
  normalizeRequiredText,
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
  normalizeRequiredText,
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

const isValidDateString = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

const createOptionalDateSchema = (fieldLabel: string) => {
  return z.preprocess(
    normalizeOptionalQueryText,
    z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        `${fieldLabel} deve estar no formato AAAA-MM-DD.`
      )
      .refine(isValidDateString, {
        message: `${fieldLabel} é inválida.`
      })
      .optional()
  )
}

const emotionQuerySchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value
    }

    const normalizedValue = value.trim().toUpperCase()

    return normalizedValue || undefined
  },
  z
    .enum(EMOTION_VALUES, {
      error: "A emoção informada é inválida."
    })
    .optional()
)

const pageQuerySchema = z.preprocess(
  (value) => {
    if (value === undefined || value === "") {
      return "1"
    }

    return value
  },
  z
    .string()
    .regex(
      /^[1-9]\d*$/,
      "A página deve ser representada por um número inteiro positivo."
    )
    .transform(Number)
    .refine((page) => page <= HISTORY_MAX_PAGE, {
      message: `A página deve ser menor ou igual a ${HISTORY_MAX_PAGE}.`
    })
)

const createTextEmotionRecordSchema = z.object({
  content: contentSchema
})

const createTranscriptEmotionRecordSchema = z.object({
  transcript: transcriptSchema,
  inputMode: z.enum(["AUDIO", "VIDEO"], {
    error: "O tipo de entrada deve ser áudio ou vídeo."
  })
})

const emotionHistoryQuerySchema = z
  .object({
    emotion: emotionQuerySchema,
    startDate: createOptionalDateSchema("A data inicial"),
    endDate: createOptionalDateSchema("A data final"),
    page: pageQuerySchema
  })
  .superRefine((data, context) => {
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "A data final não pode ser anterior à data inicial."
      })
    }
  })

const reportPeriodQuerySchema = z.object({
  period: z.preprocess(
    (value) => {
      if (value === undefined || value === "") {
        return "weekly"
      }

      return typeof value === "string" ? value.trim().toLowerCase() : value
    },
    z.enum(REPORT_PERIOD_VALUES, {
      error: "O período deve ser semanal ou mensal."
    })
  )
})

const emotionRecordIdParamsSchema = z.object({
  id: z.preprocess((value) => {
    return typeof value === "string" ? value.trim() : ""
  }, z.string().uuid("O identificador da análise é inválido."))
})

const getValidationMessage = (error: z.ZodError) => {
  return error.issues[0]?.message ?? "Os dados enviados são inválidos."
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

type EmotionHistoryQuery = z.infer<typeof emotionHistoryQuerySchema>

type ReportPeriod = z.infer<typeof reportPeriodQuerySchema>["period"]

export {
  EMOTION_TEXT_MAX_LENGTH,
  EMOTION_TEXT_MIN_LENGTH,
  HISTORY_MAX_PAGE,
  createTextEmotionRecordSchema,
  createTranscriptEmotionRecordSchema,
  emotionHistoryQuerySchema,
  emotionRecordIdParamsSchema,
  getValidationMessage,
  parseEmotionContent,
  parseEmotionTranscript,
  reportPeriodQuerySchema
}

export type { EmotionHistoryQuery, ReportPeriod }
