import type { Request, Response } from "express"

import {
  createTextEmotionRecord,
  createTranscriptEmotionRecord
} from "../services/emotion-record.service.js"

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
    const visualAnalysis = parseVisualAnalysis(req.body.visualAnalysis)
    const record = await createTranscriptEmotionRecord({
      userId,
      inputMode,
      transcript: req.body.transcript,
      ...(inputMode === "VIDEO" && visualAnalysis ? { visualAnalysis } : {})
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
      formData: req.body,
      useNewAnalysisTabs: true,
      useAudioRecorder: true,
      useVideoRecorder: true
    })
  }
}

export {
  createTextEmotionRecordController,
  createTranscriptEmotionRecordController
}
