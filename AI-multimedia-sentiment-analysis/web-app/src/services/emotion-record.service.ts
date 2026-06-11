import {
  analyzeTextEmotion,
  type EmotionType
} from "./text-emotion-analysis.service.js"

import {
  createEmotionRecord,
  listAllEmotionRecordsByUserId,
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

const getEmotionDashboardSummary = async (userId: string) => {
  const records = await listAllEmotionRecordsByUserId(userId)

  if (records.length === 0) {
    return {
      totalRecords: 0,
      mostFrequentEmotion: "Sem dados",
      averageIntensity: "0.0",
      mainTriggers: "Sem dados"
    }
  }

  const emotionCount = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.emotion] = (acc[record.emotion] || 0) + 1
    return acc
  }, {})

  const mostFrequentEmotionKey = Object.entries(emotionCount).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0]

  const validIntensities = records
    .map((record) => record.intensity)
    .filter((intensity): intensity is number => typeof intensity === "number")

  const averageIntensity =
    validIntensities.length > 0
      ? (
          validIntensities.reduce((total, intensity) => total + intensity, 0) /
          validIntensities.length
        ).toFixed(1)
      : "0.0"

  const triggerCount = records.reduce<Record<string, number>>((acc, record) => {
    if (!record.trigger) {
      return acc
    }

    const triggers = record.trigger
      .split(",")
      .map((trigger) => trigger.trim())
      .filter(Boolean)

    triggers.forEach((trigger) => {
      acc[trigger] = (acc[trigger] || 0) + 1
    })

    return acc
  }, {})

  const mainTriggers = Object.entries(triggerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trigger]) => trigger)
    .join(", ")

  return {
    totalRecords: records.length,
    mostFrequentEmotion: mostFrequentEmotionKey
      ? emotionLabels[mostFrequentEmotionKey as EmotionType]
      : "Sem dados",
    averageIntensity,
    mainTriggers: mainTriggers || "Sem gatilhos claros"
  }
}

export {
  createTextEmotionRecord,
  getEmotionDashboardSummary,
  listRecentEmotionRecords
}
