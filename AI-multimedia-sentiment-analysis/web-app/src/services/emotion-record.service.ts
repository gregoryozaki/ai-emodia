import type { EmotionType } from "../repositories/emotion-record.repository.js"

import {
  createEmotionRecord,
  listRecentEmotionRecordsByUserId
} from "../repositories/emotion-record.repository.js"

type CreateTextEmotionRecordInput = {
  userId: string
  emotion: string
  content: string
  intensity?: string
  trigger?: string
}

const allowedEmotions: EmotionType[] = [
  "ALEGRIA",
  "TRISTEZA",
  "RAIVA",
  "MEDO",
  "NOJO",
  "ANSIEDADE"
]

const emotionLabels: Record<EmotionType, string> = {
  ALEGRIA: "Alegria",
  TRISTEZA: "Tristeza",
  RAIVA: "Raiva",
  MEDO: "Medo",
  NOJO: "Nojo",
  ANSIEDADE: "Ansiedade"
}

const isEmotionType = (emotion: string): emotion is EmotionType => {
  return allowedEmotions.includes(emotion as EmotionType)
}

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date)
}

const createTextEmotionRecord = async (input: CreateTextEmotionRecordInput) => {
  const content = input.content?.trim()
  const trigger = input.trigger?.trim()
  const intensity = Number(input.intensity)

  if (!isEmotionType(input.emotion)) {
    throw new Error("Selecione uma emoção válida.")
  }

  if (!content || content.length < 3) {
    throw new Error("Descreva brevemente como você está se sentindo.")
  }

  if (content.length > 2000) {
    throw new Error("O relato deve ter no máximo 2000 caracteres.")
  }

  if (!Number.isInteger(intensity) || intensity < 1 || intensity > 5) {
    throw new Error("Selecione uma intensidade entre 1 e 5.")
  }

  if (trigger && trigger.length > 120) {
    throw new Error("O possível gatilho deve ter no máximo 120 caracteres.")
  }

  const recordData = {
    userId: input.userId,
    emotion: input.emotion,
    inputMode: "TEXT" as const,
    content,
    intensity,
    ...(trigger ? { trigger } : {})
  }

  await createEmotionRecord(recordData)
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
