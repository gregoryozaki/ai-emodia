import {
  analyzeTextEmotion,
  type EmotionType
} from "./text-emotion-analysis.service.js"

import {
  createEmotionRecord,
  listRecentEmotionRecordsByUserId
} from "../repositories/emotion-record.repository.js"

type CreateTextEmotionRecordInput = {
  userId: string
  content: string
}

const emotionLabels: Record<EmotionType, string> = {
  ALEGRIA: "Alegria",
  TRISTEZA: "Tristeza",
  RAIVA: "Raiva",
  MEDO: "Medo",
  NOJO: "Nojo",
  ANSIEDADE: "Ansiedade"
}

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date)
}

const createTextEmotionRecord = async (input: CreateTextEmotionRecordInput) => {
  const content = input.content?.trim()

  if (!content || content.length < 10) {
    throw new Error("Escreva um relato um pouco mais detalhado para análise.")
  }

  if (content.length > 3000) {
    throw new Error("O relato deve ter no máximo 3000 caracteres.")
  }

  const analysis = analyzeTextEmotion(content)

  await createEmotionRecord({
    userId: input.userId,
    emotion: analysis.emotion,
    inputMode: "TEXT",
    content,
    intensity: analysis.intensity,
    trigger: analysis.triggers.join(", ")
  })
}

const listRecentEmotionRecords = async (userId: string) => {
  const records = await listRecentEmotionRecordsByUserId(userId)

  return records.map((record) => {
    return {
      id: record.id,
      emotion: emotionLabels[record.emotion as EmotionType],
      inputMode: "Texto",
      content: record.content,
      intensity: record.intensity,
      trigger: record.trigger,
      createdAt: formatDateTime(record.createdAt)
    }
  })
}

export { createTextEmotionRecord, listRecentEmotionRecords }
