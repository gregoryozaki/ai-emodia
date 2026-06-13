import type { Request, Response } from "express"

import {
  createTextEmotionRecord,
  createTranscriptEmotionRecord
} from "../services/emotion-record.service.js"
import {
  createTextEmotionRecordSchema,
  createTranscriptEmotionRecordSchema,
  getValidationMessage
} from "../validations/emotion-record.validation.js"

type VisualConfidenceLevel = "LOW" | "MEDIUM" | "HIGH"

type ParsedVisualAnalysis = {
  emotion: string
  emodiaEmotion: string
  confidence: number
  confidenceLevel: VisualConfidenceLevel
  topGap?: number
  averageScores?: Record<string, number>
  emotionCounts?: Record<string, number>
  sampledFrames?: number
  framesAnalyzed?: number
  framesWithoutFace?: number
  frameIntervalSeconds?: number
  fps?: number
  totalFrames?: number
  durationSeconds?: number
  model?: string
  device?: string
  interpretation?: string
  warning?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null
}

const parseVisualAnalysis = (
  value: unknown
): ParsedVisualAnalysis | undefined => {
  if (typeof value !== "string" || !value.trim()) {
    return undefined
  }

  try {
    const parsed: unknown = JSON.parse(value)

    if (!isRecord(parsed)) {
      return undefined
    }

    if (
      typeof parsed.emotion !== "string" ||
      typeof parsed.emodiaEmotion !== "string" ||
      typeof parsed.confidence !== "number" ||
      !Number.isFinite(parsed.confidence) ||
      parsed.confidence < 0 ||
      parsed.confidence > 1
    ) {
      return undefined
    }

    if (
      parsed.confidenceLevel !== "LOW" &&
      parsed.confidenceLevel !== "MEDIUM" &&
      parsed.confidenceLevel !== "HIGH"
    ) {
      return undefined
    }

    return parsed as ParsedVisualAnalysis
  } catch {
    return undefined
  }
}

const getNewAnalysisViewOptions = () => {
  return {
    title: "Emodia | Nova análise",
    useNewAnalysisTabs: true,
    useAudioRecorder: true,
    useVideoRecorder: true,
    useAnalysisSubmitLoading: true
  }
}

const createTextEmotionRecordController = async (
  req: Request,
  res: Response
) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  const validation = createTextEmotionRecordSchema.safeParse(req.body)

  if (!validation.success) {
    res.status(400).render("app/new-analysis", {
      ...getNewAnalysisViewOptions(),
      error: getValidationMessage(validation.error),
      formData: {
        content: typeof req.body.content === "string" ? req.body.content : ""
      }
    })
    return
  }

  try {
    const record = await createTextEmotionRecord({
      userId,
      content: validation.data.content
    })

    res.redirect(`/analises/${record.id}?created=1`)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao registrar emoção."

    res.status(400).render("app/new-analysis", {
      ...getNewAnalysisViewOptions(),
      error: message,
      formData: {
        content: typeof req.body.content === "string" ? req.body.content : ""
      }
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

  const validation = createTranscriptEmotionRecordSchema.safeParse(req.body)

  if (!validation.success) {
    res.status(400).render("app/new-analysis", {
      ...getNewAnalysisViewOptions(),
      error: getValidationMessage(validation.error),
      formData: {
        transcript:
          typeof req.body.transcript === "string" ? req.body.transcript : ""
      }
    })
    return
  }

  try {
    const { inputMode, transcript } = validation.data

    const visualAnalysis = parseVisualAnalysis(req.body.visualAnalysis)

    const record = await createTranscriptEmotionRecord({
      userId,
      inputMode,
      transcript,
      ...(inputMode === "VIDEO" && visualAnalysis ? { visualAnalysis } : {})
    })

    res.redirect(`/analises/${record.id}?created=1`)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao registrar emoção."

    res.status(400).render("app/new-analysis", {
      ...getNewAnalysisViewOptions(),
      error: message,
      formData: {
        transcript:
          typeof req.body.transcript === "string" ? req.body.transcript : ""
      }
    })
  }
}

export {
  createTextEmotionRecordController,
  createTranscriptEmotionRecordController
}
