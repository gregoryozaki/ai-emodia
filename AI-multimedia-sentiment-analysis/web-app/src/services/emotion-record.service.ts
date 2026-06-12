import {
  createEmotionRecord,
  findEmotionRecordByIdAndUserId,
  findEmotionRecordsByPeriod,
  findEmotionRecordsByUserId,
  findEmotionRecordsForDashboardByUserId,
  findRecentEmotionRecordsByUserId,
  type EmotionType
} from "../repositories/emotion-record.repository.js"
import { analyzeTextEmotion } from "./text-emotion-analysis.service.js"

type CreateTextEmotionRecordInput = {
  userId: string
  content: string
}

type EmotionHistoryQuery = {
  emotion?: string
  startDate?: string
  endDate?: string
  page?: string
}

const EMOTION_LABELS: Record<EmotionType, string> = {
  ALEGRIA: "Alegria",
  TRISTEZA: "Tristeza",
  RAIVA: "Raiva",
  MEDO: "Medo",
  NOJO: "Nojo",
  ANSIEDADE: "Ansiedade"
}

const VALID_EMOTIONS = Object.keys(EMOTION_LABELS) as EmotionType[]

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    dateStyle: "short"
  }).format(date)
}

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date)
}

const formatDateInput = (date: Date) => {
  const [formattedDate] = date.toISOString().split("T")
  return formattedDate ?? ""
}

const parseStartDate = (date?: string) => {
  if (!date) {
    return undefined
  }

  return new Date(`${date}T00:00:00.000Z`)
}

const parseEndDate = (date?: string) => {
  if (!date) {
    return undefined
  }

  return new Date(`${date}T23:59:59.999Z`)
}

const normalizeEmotion = (emotion?: string) => {
  if (!emotion) {
    return undefined
  }

  const normalizedEmotion = emotion.toUpperCase() as EmotionType

  if (!VALID_EMOTIONS.includes(normalizedEmotion)) {
    return undefined
  }

  return normalizedEmotion
}

const createTextEmotionRecord = async (input: CreateTextEmotionRecordInput) => {
  const content = input.content.trim()

  if (!content) {
    throw new Error("Informe um texto para análise.")
  }

  const analysis = analyzeTextEmotion(content)

  return createEmotionRecord({
    userId: input.userId,
    emotion: analysis.emotion,
    inputMode: "TEXT",
    content,
    intensity: analysis.intensity,
    trigger: analysis.triggers.join(", ")
  })
}

const getEmotionDashboardSummary = async (userId: string) => {
  const records = await findEmotionRecordsForDashboardByUserId(userId)
  const recentRecords = await findRecentEmotionRecordsByUserId(userId, 5)

  const totalRecords = records.length

  const emotionCount = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.emotion] = (acc[record.emotion] ?? 0) + 1
    return acc
  }, {})

  const mostFrequentEmotionEntry = Object.entries(emotionCount).sort(
    (a, b) => b[1] - a[1]
  )[0]

  const averageIntensity =
    totalRecords > 0
      ? Math.round(
          records.reduce((sum, record) => sum + (record.intensity ?? 0), 0) /
            totalRecords
        )
      : 0

  const triggerCount = records.reduce<Record<string, number>>((acc, record) => {
    if (!record.trigger) {
      return acc
    }

    const triggers = record.trigger
      .split(",")
      .map((trigger) => trigger.trim())
      .filter(Boolean)

    triggers.forEach((trigger) => {
      acc[trigger] = (acc[trigger] ?? 0) + 1
    })

    return acc
  }, {})

  const mainTriggers = Object.entries(triggerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([trigger]) => trigger)

  const emotionChart = Object.entries(emotionCount).map(([emotion, count]) => {
    return {
      emotion,
      label: EMOTION_LABELS[emotion as EmotionType],
      count,
      percentage:
        totalRecords > 0 ? Math.round((count / totalRecords) * 100) : 0
    }
  })

  return {
    totalRecords,
    mostFrequentEmotion: mostFrequentEmotionEntry
      ? EMOTION_LABELS[mostFrequentEmotionEntry[0] as EmotionType]
      : "Sem dados",
    averageIntensity,
    mainTriggers,
    emotionChart,
    recentRecords: recentRecords.map((record) => {
      return {
        id: record.id,
        emotion: record.emotion,
        emotionLabel: EMOTION_LABELS[record.emotion],
        inputMode: record.inputMode,
        content: record.content,
        intensity: record.intensity,
        trigger: record.trigger,
        createdAt: formatDateTime(record.createdAt)
      }
    })
  }
}

const getEmotionHistory = async (
  userId: string,
  query: EmotionHistoryQuery
) => {
  const page = Number(query.page ?? "1")
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page
  const perPage = 10

  const emotion = normalizeEmotion(query.emotion)
  const startDate = parseStartDate(query.startDate)
  const endDate = parseEndDate(query.endDate)

  const filters = {
    userId,
    page: safePage,
    perPage,
    ...(emotion ? { emotion } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {})
  }

  const result = await findEmotionRecordsByUserId(filters)

  const totalPages = Math.max(Math.ceil(result.total / perPage), 1)

  return {
    records: result.records.map((record) => {
      return {
        id: record.id,
        emotion: record.emotion,
        emotionLabel: EMOTION_LABELS[record.emotion],
        inputMode: record.inputMode,
        content: record.content,
        intensity: record.intensity,
        trigger: record.trigger,
        createdAt: formatDateTime(record.createdAt)
      }
    }),
    total: result.total,
    currentPage: safePage,
    totalPages,
    hasPreviousPage: safePage > 1,
    hasNextPage: safePage < totalPages,
    previousPage: safePage - 1,
    nextPage: safePage + 1,
    filters: {
      emotion: emotion ?? "",
      startDate: query.startDate ?? "",
      endDate: query.endDate ?? ""
    },
    emotions: VALID_EMOTIONS.map((emotionValue) => {
      return {
        value: emotionValue,
        label: EMOTION_LABELS[emotionValue],
        selected: emotion === emotionValue
      }
    })
  }
}

const getEmotionRecordDetails = async (userId: string, recordId: string) => {
  const record = await findEmotionRecordByIdAndUserId(recordId, userId)

  if (!record) {
    throw new Error("Registro emocional não encontrado.")
  }

  return {
    id: record.id,
    emotion: record.emotion,
    emotionLabel: EMOTION_LABELS[record.emotion],
    inputMode: record.inputMode,
    content: record.content,
    intensity: record.intensity,
    trigger: record.trigger,
    createdAt: formatDateTime(record.createdAt),
    createdDateInput: formatDateInput(record.createdAt)
  }
}

const getEmotionReports = async (userId: string) => {
  const now = new Date()

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)

  const monthStart = new Date(now)
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const weekRecords = await findEmotionRecordsByPeriod(userId, weekStart, now)
  const monthRecords = await findEmotionRecordsByPeriod(userId, monthStart, now)

  const buildSummary = (records: typeof weekRecords) => {
    const total = records.length

    const emotionCount = records.reduce<Record<string, number>>(
      (acc, record) => {
        acc[record.emotion] = (acc[record.emotion] ?? 0) + 1
        return acc
      },
      {}
    )

    const mostFrequentEmotionEntry = Object.entries(emotionCount).sort(
      (a, b) => b[1] - a[1]
    )[0]

    const averageIntensity =
      total > 0
        ? Math.round(
            records.reduce((sum, record) => sum + (record.intensity ?? 0), 0) /
              total
          )
        : 0

    return {
      total,
      averageIntensity,
      mostFrequentEmotion: mostFrequentEmotionEntry
        ? EMOTION_LABELS[mostFrequentEmotionEntry[0] as EmotionType]
        : "Sem dados",
      emotionDistribution: Object.entries(emotionCount).map(
        ([emotion, count]) => {
          return {
            emotion,
            label: EMOTION_LABELS[emotion as EmotionType],
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
          }
        }
      )
    }
  }

  return {
    weekly: {
      title: "Relatório semanal",
      period: `${formatDate(weekStart)} até ${formatDate(now)}`,
      ...buildSummary(weekRecords)
    },
    monthly: {
      title: "Relatório mensal",
      period: `${formatDate(monthStart)} até ${formatDate(now)}`,
      ...buildSummary(monthRecords)
    },
    exportPdfReady: false
  }
}

export {
  getEmotionDashboardSummary,
  getEmotionHistory,
  getEmotionRecordDetails,
  getEmotionReports,
  createTextEmotionRecord
}
