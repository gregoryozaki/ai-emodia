import prisma from "../database/prisma.js"

type EmotionType =
  | "ALEGRIA"
  | "TRISTEZA"
  | "RAIVA"
  | "MEDO"
  | "NOJO"
  | "ANSIEDADE"

type EmotionInputMode = "TEXT" | "AUDIO" | "VIDEO"

type CreateEmotionRecordData = {
  userId: string
  emotion: EmotionType
  inputMode: EmotionInputMode
  content?: string
  intensity?: number
  trigger?: string
}

const createEmotionRecord = async (data: CreateEmotionRecordData) => {
  return prisma.emotionRecord.create({
    data
  })
}

const listRecentEmotionRecordsByUserId = async (userId: string, limit = 5) => {
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

const listAllEmotionRecordsByUserId = async (userId: string) => {
  return prisma.emotionRecord.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: "desc"
    }
  })
}

export {
  createEmotionRecord,
  listRecentEmotionRecordsByUserId,
  listAllEmotionRecordsByUserId
}
export type { EmotionType, EmotionInputMode }
