import {
  createEmotionRecord,
  findEmotionRecordByIdAndUserId,
  findEmotionRecordsByPeriod,
  findEmotionRecordsByUserId,
  findEmotionRecordsForDashboardByUserId,
  findRecentEmotionRecordsByUserId,
  type EmotionInputMode,
  type EmotionType,
  type RiskLevel
} from "../repositories/emotion-record.repository.js"
import { analyzeRiskSignals } from "./risk-analysis.service.js"
import { analyzeTextEmotion } from "./text-emotion-analysis.service.js"

type CreateTextEmotionRecordInput = {
  userId: string
  content: string
}

type VisualConfidenceLevel = "LOW" | "MEDIUM" | "HIGH"

type VisualAnalysisInput = {
  emotion: string
  emodiaEmotion: string
  confidence: number
  confidenceLevel: VisualConfidenceLevel
  topGap?: number
  averageScores?: Record<string, number>
  emotionCounts?: Record<string, number>
  framesAnalyzed?: number
  frameIntervalSeconds?: number
  model?: string
  input?: string
  interpretation?: string
  warning?: string
  [key: string]: unknown
}

type CreateTranscriptEmotionRecordInput = {
  userId: string
  transcript: string
  inputMode: Extract<EmotionInputMode, "AUDIO" | "VIDEO">
  visualAnalysis?: VisualAnalysisInput
}

type EmotionHistoryQuery = {
  emotion?: string
  startDate?: string
  endDate?: string
  page?: string
}

type ReportPeriod = "weekly" | "monthly"

type ReportSummaryRecord = {
  id: string
  emotion: EmotionType
  emotionLabel: string
  inputMode: string
  content: string | null
  transcript: string | null
  intensity: number | null
  trigger: string | null
  riskLevel: RiskLevel
  riskMessage: string | null
  riskTerms: string | null
  createdAt: string
}

type ReportRiskSignal = {
  category: string
  severity: Exclude<RiskLevel, "NONE">
  occurrences: number
  terms: string[]
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

const RISK_PRIORITY: Record<RiskLevel, number> = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
}

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

const getHighestRiskLevel = (levels: RiskLevel[]) => {
  return levels.reduce<RiskLevel>((highest, current) => {
    return RISK_PRIORITY[current] > RISK_PRIORITY[highest] ? current : highest
  }, "NONE")
}

const buildPeriodRiskMessage = (riskLevel: RiskLevel) => {
  if (riskLevel === "CRITICAL") {
    return "Foram identificados termos associados a risco grave, autoagressão, abuso ou sofrimento intenso. Este relatório não confirma uma situação de risco, mas recomenda buscar apoio imediatamente caso esses registros representem uma situação real e atual."
  }

  if (riskLevel === "HIGH") {
    return "Foram identificados termos associados a violência, ameaça ou sofrimento relevante. Considere procurar apoio de pessoas de confiança, serviços especializados ou autoridades competentes se houver risco à segurança."
  }

  if (riskLevel === "MEDIUM") {
    return "Foram identificados termos de sofrimento emocional relevante. Observe se esses temas continuam aparecendo e considere buscar apoio caso estejam afetando sua rotina."
  }

  if (riskLevel === "LOW") {
    return "Foram identificados sinais leves de atenção emocional. Continue acompanhando seus registros para entender melhor seus gatilhos e padrões."
  }

  return "Nenhum termo crítico foi identificado nos registros deste período."
}

const splitTriggers = (trigger?: string | null) => {
  if (!trigger) {
    return []
  }

  return trigger
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

const createTextEmotionRecord = async (input: CreateTextEmotionRecordInput) => {
  const content = input.content.trim()

  if (!content) {
    throw new Error("Informe um texto para análise.")
  }

  const analysis = analyzeTextEmotion(content)
  const riskAnalysis = analyzeRiskSignals(content)

  return createEmotionRecord({
    userId: input.userId,
    emotion: analysis.emotion,
    inputMode: "TEXT",
    content,
    intensity: analysis.intensity,
    trigger: analysis.triggers.join(", "),
    riskLevel: riskAnalysis.riskLevel,
    ...(riskAnalysis.riskMessage
      ? { riskMessage: riskAnalysis.riskMessage }
      : {}),
    ...(riskAnalysis.riskTerms ? { riskTerms: riskAnalysis.riskTerms } : {})
  })
}

const createTranscriptEmotionRecord = async (
  input: CreateTranscriptEmotionRecordInput
) => {
  const transcript = input.transcript.trim()

  if (!transcript) {
    throw new Error("Informe uma transcrição para análise.")
  }

  const analysis = analyzeTextEmotion(transcript)
  const riskAnalysis = analyzeRiskSignals(transcript)

  return createEmotionRecord({
    userId: input.userId,
    emotion: analysis.emotion,
    inputMode: input.inputMode,
    content: transcript,
    transcript,
    intensity: analysis.intensity,
    trigger: analysis.triggers.join(", "),
    riskLevel: riskAnalysis.riskLevel,
    ...(riskAnalysis.riskMessage
      ? { riskMessage: riskAnalysis.riskMessage }
      : {}),
    ...(riskAnalysis.riskTerms ? { riskTerms: riskAnalysis.riskTerms } : {}),
    ...(input.visualAnalysis
      ? {
          visualEmotion: input.visualAnalysis.emotion,
          visualEmodiaEmotion: input.visualAnalysis.emodiaEmotion,
          visualConfidence: input.visualAnalysis.confidence,
          visualConfidenceLevel: input.visualAnalysis.confidenceLevel,
          visualAnalysis: input.visualAnalysis
        }
      : {})
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
    const triggers = splitTriggers(record.trigger)

    triggers.forEach((trigger) => {
      acc[trigger] = (acc[trigger] ?? 0) + 1
    })

    return acc
  }, {})

  const mainTriggers = Object.entries(triggerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([trigger]) => trigger)

  const triggerChart = Object.entries(triggerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([trigger, count]) => {
      return {
        trigger,
        count,
        percentage:
          totalRecords > 0 ? Math.round((count / totalRecords) * 100) : 0
      }
    })

  const emotionChart = Object.entries(emotionCount).map(([emotion, count]) => {
    return {
      emotion,
      label: EMOTION_LABELS[emotion as EmotionType],
      count,
      percentage:
        totalRecords > 0 ? Math.round((count / totalRecords) * 100) : 0
    }
  })

  const temporalRecords = records
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((record) => {
      const triggers = splitTriggers(record.trigger)

      return {
        id: record.id,
        date: record.createdAt.toISOString(),
        dateLabel: formatDate(record.createdAt),
        dateTimeLabel: formatDateTime(record.createdAt),
        emotion: record.emotion,
        emotionLabel: EMOTION_LABELS[record.emotion],
        intensity: record.intensity ?? 0,
        triggers
      }
    })

  const temporalEmotionOptions = Array.from(
    new Set(temporalRecords.map((record) => record.emotionLabel))
  ).map((emotion) => ({
    value: emotion,
    label: emotion
  }))

  const temporalTriggerOptions = Array.from(
    new Set(temporalRecords.flatMap((record) => record.triggers))
  ).map((trigger) => ({
    value: trigger,
    label: trigger
  }))

  return {
    totalRecords,
    mostFrequentEmotion: mostFrequentEmotionEntry
      ? EMOTION_LABELS[mostFrequentEmotionEntry[0] as EmotionType]
      : "Sem dados",
    averageIntensity,
    mainTriggers,
    triggerChart,
    emotionChart,
    temporalChart: {
      records: temporalRecords,
      emotionOptions: temporalEmotionOptions,
      triggerOptions: temporalTriggerOptions
    },
    recentRecords: recentRecords.map((record) => {
      return {
        id: record.id,
        emotion: record.emotion,
        emotionLabel: EMOTION_LABELS[record.emotion],
        inputMode: record.inputMode,
        content: record.content,
        transcript: record.transcript,
        intensity: record.intensity,
        trigger: record.trigger,
        riskLevel: record.riskLevel,
        riskMessage: record.riskMessage,
        riskTerms: record.riskTerms,
        hasRiskAlert:
          record.riskLevel === "HIGH" || record.riskLevel === "CRITICAL",
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
        transcript: record.transcript,
        intensity: record.intensity,
        trigger: record.trigger,
        riskLevel: record.riskLevel,
        riskMessage: record.riskMessage,
        riskTerms: record.riskTerms,
        hasRiskAlert:
          record.riskLevel === "HIGH" || record.riskLevel === "CRITICAL",
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

  const hasRiskAlert =
    record.riskLevel === "HIGH" || record.riskLevel === "CRITICAL"

  return {
    id: record.id,
    emotion: record.emotion,
    emotionLabel: EMOTION_LABELS[record.emotion],
    inputMode: record.inputMode,
    content: record.content,
    transcript: record.transcript,
    intensity: record.intensity,
    trigger: record.trigger,
    riskLevel: record.riskLevel,
    riskMessage: record.riskMessage,
    riskTerms: record.riskTerms,

    visualEmotion: record.visualEmotion,
    visualEmodiaEmotion: record.visualEmodiaEmotion,
    visualConfidence: record.visualConfidence,
    visualConfidencePercent:
      record.visualConfidence !== null
        ? `${Math.round(record.visualConfidence * 100)}%`
        : null,
    visualConfidenceLevel: record.visualConfidenceLevel,
    visualAnalysis: record.visualAnalysis,
    hasVisualAnalysis: Boolean(record.visualEmotion),

    hasRiskAlert,

    createdAt: formatDateTime(record.createdAt),
    createdDateInput: formatDateInput(record.createdAt)
  }
}

const calculateAverageIntensity = (
  records: Array<{ intensity: number | null }>
) => {
  if (records.length === 0) {
    return 0
  }

  return Math.round(
    records.reduce((sum, record) => {
      return sum + (record.intensity ?? 0)
    }, 0) / records.length
  )
}

const getPeriodDates = (period: ReportPeriod) => {
  const now = new Date()

  if (period === "weekly") {
    const currentStart = new Date(now)
    currentStart.setDate(now.getDate() - 6)
    currentStart.setHours(0, 0, 0, 0)

    const previousEnd = new Date(currentStart)
    previousEnd.setMilliseconds(-1)

    const previousStart = new Date(previousEnd)
    previousStart.setDate(previousEnd.getDate() - 6)
    previousStart.setHours(0, 0, 0, 0)

    return {
      currentStart,
      currentEnd: now,
      previousStart,
      previousEnd
    }
  }

  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
  currentStart.setHours(0, 0, 0, 0)

  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  previousStart.setHours(0, 0, 0, 0)

  const previousEnd = new Date(currentStart)
  previousEnd.setMilliseconds(-1)

  return {
    currentStart,
    currentEnd: now,
    previousStart,
    previousEnd
  }
}

const buildTriggerDistribution = (
  records: Array<{ trigger: string | null }>
) => {
  const triggerCount = records.reduce<Record<string, number>>((acc, record) => {
    const triggers = splitTriggers(record.trigger)

    triggers.forEach((trigger) => {
      acc[trigger] = (acc[trigger] ?? 0) + 1
    })

    return acc
  }, {})

  return Object.entries(triggerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([trigger, count]) => {
      return {
        trigger,
        count,
        percentage:
          records.length > 0 ? Math.round((count / records.length) * 100) : 0
      }
    })
}

const buildEmotionDistribution = (records: Array<{ emotion: EmotionType }>) => {
  const emotionCount = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.emotion] = (acc[record.emotion] ?? 0) + 1
    return acc
  }, {})

  return Object.entries(emotionCount)
    .sort((a, b) => b[1] - a[1])
    .map(([emotion, count]) => {
      return {
        emotion,
        label: EMOTION_LABELS[emotion as EmotionType],
        count,
        percentage:
          records.length > 0 ? Math.round((count / records.length) * 100) : 0
      }
    })
}

const buildReportRiskAnalysis = (
  records: Array<{
    content: string | null
    transcript: string | null
    riskLevel: RiskLevel
    riskMessage: string | null
    riskTerms: string | null
  }>
) => {
  const signalMap = new Map<string, ReportRiskSignal>()
  const detectedLevels: RiskLevel[] = []

  records.forEach((record) => {
    const textToAnalyze = record.content ?? record.transcript ?? ""

    if (!textToAnalyze.trim()) {
      return
    }

    const analysis = analyzeRiskSignals(textToAnalyze)

    if (analysis.riskLevel !== "NONE") {
      detectedLevels.push(analysis.riskLevel)
    }

    analysis.signals.forEach((signal) => {
      const existingSignal = signalMap.get(signal.category)

      if (!existingSignal) {
        signalMap.set(signal.category, {
          category: signal.category,
          severity: signal.severity,
          occurrences: signal.occurrences,
          terms: [...signal.terms]
        })

        return
      }

      existingSignal.occurrences += signal.occurrences

      signal.terms.forEach((term) => {
        if (!existingSignal.terms.includes(term)) {
          existingSignal.terms.push(term)
        }
      })

      if (
        RISK_PRIORITY[signal.severity] > RISK_PRIORITY[existingSignal.severity]
      ) {
        existingSignal.severity = signal.severity
      }
    })
  })

  const riskLevel = getHighestRiskLevel(detectedLevels)
  const signals = Array.from(signalMap.values()).sort((a, b) => {
    return RISK_PRIORITY[b.severity] - RISK_PRIORITY[a.severity]
  })

  return {
    hasRisk: riskLevel !== "NONE",
    hasCriticalRisk: riskLevel === "CRITICAL",
    hasHighRisk: riskLevel === "HIGH" || riskLevel === "CRITICAL",
    alertMessage: buildPeriodRiskMessage(riskLevel),
    signals
  }
}

const buildReportAdvice = (params: {
  total: number
  averageIntensity: number
  mostFrequentEmotion: string
  intensityVariation: number
  hasCriticalRisk: boolean
  hasHighRisk: boolean
}) => {
  if (params.total === 0) {
    return {
      title: "Sem dados suficientes",
      message:
        "Ainda não há registros suficientes neste período para gerar uma análise confiável. Continue registrando seus relatos para acompanhar sua evolução emocional.",
      alertLevel: "neutral"
    }
  }

  if (params.hasCriticalRisk) {
    return {
      title: "Atenção: sinais críticos identificados",
      message:
        "Este período contém termos associados a risco grave, autoagressão, abuso ou sofrimento intenso. O Emodia não realiza diagnóstico, mas recomenda buscar apoio imediatamente caso esses registros representem uma situação real e atual. Converse com alguém de confiança, procure atendimento profissional ou acione um serviço de emergência. No Brasil, o CVV atende pelo 188.",
      alertLevel: "critical"
    }
  }

  if (params.hasHighRisk) {
    return {
      title: "Atenção: sinais de risco identificados",
      message:
        "Este período contém termos associados a violência, ameaça ou sofrimento relevante. Caso exista risco à sua segurança, procure apoio de pessoas de confiança, serviços especializados ou autoridades competentes.",
      alertLevel: "high"
    }
  }

  const emotion = params.mostFrequentEmotion.toLowerCase()

  if (
    params.averageIntensity >= 7 &&
    ["tristeza", "ansiedade", "medo", "raiva"].includes(emotion)
  ) {
    return {
      title: "Período emocionalmente intenso",
      message:
        "Este período apresentou sinais de carga emocional elevada. Considere conversar com alguém de confiança, reduzir sobrecargas quando possível e procurar apoio profissional caso esses sentimentos estejam afetando seu sono, rotina, estudos, trabalho ou segurança.",
      alertLevel: "high"
    }
  }

  if (
    params.averageIntensity >= 5 &&
    ["tristeza", "ansiedade", "medo", "raiva"].includes(emotion)
  ) {
    return {
      title: "Atenção ao seu ritmo",
      message:
        "Os registros indicam um período com desconforto emocional moderado. Tente observar os gatilhos mais frequentes, fazer pausas, organizar prioridades e buscar conversa ou apoio antes que a situação fique mais pesada.",
      alertLevel: "medium"
    }
  }

  if (params.intensityVariation < 0) {
    return {
      title: "Sinais de melhora",
      message:
        "A intensidade média diminuiu em relação ao período anterior. Isso pode indicar melhora ou maior estabilidade. Continue registrando seus relatos para confirmar se essa tendência se mantém.",
      alertLevel: "positive"
    }
  }

  if (emotion === "alegria") {
    return {
      title: "Período positivo",
      message:
        "Os registros indicam predominância de emoções positivas. Continue observando quais situações estão contribuindo para esse estado e tente preservar esses hábitos na sua rotina.",
      alertLevel: "positive"
    }
  }

  return {
    title: "Acompanhamento contínuo",
    message:
      "O período apresenta registros emocionais variados. Use os gatilhos e a intensidade média como sinais para entender melhor sua rotina e tomar decisões com mais consciência.",
    alertLevel: "neutral"
  }
}

const buildSummary = (
  records: Awaited<ReturnType<typeof findEmotionRecordsByPeriod>>,
  previousRecords: Awaited<ReturnType<typeof findEmotionRecordsByPeriod>>
) => {
  const total = records.length
  const previousTotal = previousRecords.length

  const emotionDistribution = buildEmotionDistribution(records)
  const triggerDistribution = buildTriggerDistribution(records)

  const mostFrequentEmotion = emotionDistribution[0]?.label ?? "Sem dados"

  const averageIntensity = calculateAverageIntensity(records)
  const previousAverageIntensity = calculateAverageIntensity(previousRecords)

  const intensityVariation = averageIntensity - previousAverageIntensity
  const totalVariation = total - previousTotal

  const riskAnalysis = buildReportRiskAnalysis(records)

  const advice = buildReportAdvice({
    total,
    averageIntensity,
    mostFrequentEmotion,
    intensityVariation,
    hasCriticalRisk: riskAnalysis.hasCriticalRisk,
    hasHighRisk: riskAnalysis.hasHighRisk
  })

  return {
    total,
    previousTotal,
    totalVariation,
    averageIntensity,
    previousAverageIntensity,
    intensityVariation,
    mostFrequentEmotion,
    emotionDistribution,
    triggerDistribution,
    riskAnalysis,
    advice,
    records: records.map((record): ReportSummaryRecord => {
      return {
        id: record.id,
        emotion: record.emotion,
        emotionLabel: EMOTION_LABELS[record.emotion],
        inputMode: record.inputMode,
        content: record.content,
        transcript: record.transcript,
        intensity: record.intensity,
        trigger: record.trigger,
        riskLevel: record.riskLevel,
        riskMessage: record.riskMessage,
        riskTerms: record.riskTerms,
        createdAt: formatDateTime(record.createdAt)
      }
    })
  }
}

const getEmotionReports = async (userId: string) => {
  const weeklyDates = getPeriodDates("weekly")
  const monthlyDates = getPeriodDates("monthly")

  const [weekRecords, previousWeekRecords, monthRecords, previousMonthRecords] =
    await Promise.all([
      findEmotionRecordsByPeriod(
        userId,
        weeklyDates.currentStart,
        weeklyDates.currentEnd
      ),
      findEmotionRecordsByPeriod(
        userId,
        weeklyDates.previousStart,
        weeklyDates.previousEnd
      ),
      findEmotionRecordsByPeriod(
        userId,
        monthlyDates.currentStart,
        monthlyDates.currentEnd
      ),
      findEmotionRecordsByPeriod(
        userId,
        monthlyDates.previousStart,
        monthlyDates.previousEnd
      )
    ])

  return {
    weekly: {
      title: "Relatório semanal",
      period: `${formatDate(weeklyDates.currentStart)} até ${formatDate(
        weeklyDates.currentEnd
      )}`,
      previousPeriod: `${formatDate(weeklyDates.previousStart)} até ${formatDate(
        weeklyDates.previousEnd
      )}`,
      ...buildSummary(weekRecords, previousWeekRecords)
    },
    monthly: {
      title: "Relatório mensal",
      period: `${formatDate(monthlyDates.currentStart)} até ${formatDate(
        monthlyDates.currentEnd
      )}`,
      previousPeriod: `${formatDate(
        monthlyDates.previousStart
      )} até ${formatDate(monthlyDates.previousEnd)}`,
      ...buildSummary(monthRecords, previousMonthRecords)
    },
    exportPdfReady: true
  }
}

const getEmotionReportByPeriod = async (
  userId: string,
  period: ReportPeriod
) => {
  const reports = await getEmotionReports(userId)

  return period === "monthly" ? reports.monthly : reports.weekly
}

export {
  createTextEmotionRecord,
  createTranscriptEmotionRecord,
  getEmotionDashboardSummary,
  getEmotionHistory,
  getEmotionRecordDetails,
  getEmotionReportByPeriod,
  getEmotionReports
}

export type { ReportPeriod }
