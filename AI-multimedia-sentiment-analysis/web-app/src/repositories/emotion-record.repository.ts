import prisma from "../database/prisma.js"

type EmotionType =
  | "ALEGRIA"
  | "TRISTEZA"
  | "RAIVA"
  | "MEDO"
  | "NOJO"
  | "ANSIEDADE"

type EmotionInputMode = "TEXT" | "AUDIO" | "VIDEO"

type RiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

type CreateEmotionRecordData = {
  userId: string
  emotion: EmotionType
  inputMode: EmotionInputMode
  content?: string
  transcript?: string
  intensity?: number
  trigger?: string
  riskLevel?: RiskLevel
  riskMessage?: string
  riskTerms?: string
}

type EmotionRecordFilters = {
  userId: string
  emotion?: EmotionType
  startDate?: Date
  endDate?: Date
  page: number
  perPage: number
}

const createEmotionRecord = async (data: CreateEmotionRecordData) => {
  return prisma.emotionRecord.create({
    data
  })
}

const countEmotionRecordsByUserId = async (userId: string) => {
  return prisma.emotionRecord.count({
    where: {
      userId
    }
  })
}

const findRecentEmotionRecordsByUserId = async (userId: string, limit = 5) => {
  return prisma.emotionRecord.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: "desc"
    },
    take: limit
  })
}

const findEmotionRecordsForDashboardByUserId = async (userId: string) => {
  return prisma.emotionRecord.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: "desc"
    }
  })
}

const findEmotionRecordsByUserId = async (filters: EmotionRecordFilters) => {
  const where = {
    userId: filters.userId,
    ...(filters.emotion ? { emotion: filters.emotion } : {}),
    ...(filters.startDate || filters.endDate
      ? {
          createdAt: {
            ...(filters.startDate ? { gte: filters.startDate } : {}),
            ...(filters.endDate ? { lte: filters.endDate } : {})
          }
        }
      : {})
  }

  const [records, total] = await Promise.all([
    prisma.emotionRecord.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      skip: (filters.page - 1) * filters.perPage,
      take: filters.perPage
    }),
    prisma.emotionRecord.count({
      where
    })
  ])

  return {
    records,
    total
  }
}

const findEmotionRecordByIdAndUserId = async (id: string, userId: string) => {
  return prisma.emotionRecord.findFirst({
    where: {
      id,
      userId
    }
  })
}

const findEmotionRecordsByPeriod = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  return prisma.emotionRecord.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  })
}

export {
  countEmotionRecordsByUserId,
  createEmotionRecord,
  findEmotionRecordByIdAndUserId,
  findEmotionRecordsByPeriod,
  findEmotionRecordsByUserId,
  findEmotionRecordsForDashboardByUserId,
  findRecentEmotionRecordsByUserId
}

export type { EmotionInputMode, EmotionType, RiskLevel }
