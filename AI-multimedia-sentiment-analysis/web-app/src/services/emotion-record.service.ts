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

type ReportPeriod = "weekly" | "monthly"

type ReportSummaryRecord = {
  id: string
  emotion: EmotionType
  emotionLabel: string
  inputMode: string
  content: string | null
  intensity: number | null
  trigger: string | null
  createdAt: string
}

const EMOTION_LABELS: Record<EmotionType, string> = {
  ALEGRIA: "Alegria",
  TRISTEZA: "Tristeza",
  RAIVA: "Raiva",
  MEDO: "Medo",
  NOJO: "Nojo",
  ANSIEDADE: "Ansiedade"
}

const RISK_TERMS = [
  {
    category: "Risco de autoagressão ou suicídio",
    severity: "critical",
    terms: [
      "me matar",
      "quero me matar",
      "vou me matar",
      "suicídio",
      "suicidio",
      "tirar minha vida",
      "não quero mais viver",
      "nao quero mais viver",
      "queria morrer",
      "vontade de morrer",
      "acabar com tudo",
      "sumir para sempre",
      "automutilação",
      "automutilacao",
      "me cortar"
    ]
  },
  {
    category: "Violência, ameaça ou agressão",
    severity: "high",
    terms: [
      "violência doméstica",
      "violencia domestica",
      "apanhei",
      "me bateu",
      "agressão",
      "agressao",
      "ameaça",
      "ameaca",
      "ameaçado",
      "ameacado",
      "medo de apanhar",
      "fui atacado",
      "fui atacada"
    ]
  },
  {
    category: "Abuso ou violência sexual",
    severity: "critical",
    terms: [
      "abuso",
      "abusado",
      "abusada",
      "assédio",
      "assedio",
      "estupro",
      "violência sexual",
      "violencia sexual",
      "tocou em mim",
      "me forçou",
      "me forcou"
    ]
  },
  {
    category: "Sofrimento emocional intenso",
    severity: "medium",
    terms: [
      "desespero",
      "desesperado",
      "desesperada",
      "não aguento mais",
      "nao aguento mais",
      "não suporto mais",
      "nao suporto mais",
      "crise",
      "pânico",
      "panico",
      "sem saída",
      "sem saida"
    ]
  }
]

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
      const triggers = record.trigger
        ? record.trigger
            .split(",")
            .map((trigger) => trigger.trim())
            .filter(Boolean)
        : []

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

const splitTriggers = (trigger?: string | null) => {
  if (!trigger) {
    return []
  }

  return trigger
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
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

const buildReportAdvice = (params: {
  total: number
  averageIntensity: number
  mostFrequentEmotion: string
  intensityVariation: number
}) => {
  if (params.total === 0) {
    return {
      title: "Sem dados suficientes",
      message:
        "Ainda não há registros suficientes neste período para gerar uma análise confiável. Continue registrando seus relatos para acompanhar sua evolução emocional.",
      alertLevel: "neutral"
    }
  }

  const emotion = params.mostFrequentEmotion.toLowerCase()

  if (
    params.averageIntensity >= 7 &&
    ["tristeza", "ansiedade", "medo"].includes(emotion)
  ) {
    return {
      title: "Atenção: sofrimento emocional elevado",
      message:
        "Os registros indicam intensidade emocional alta associada a emoções difíceis. Caso existam pensamentos de autoagressão, vontade de morrer, violência ou risco imediato, procure ajuda agora: converse com alguém de confiança, busque atendimento profissional ou acione um serviço de emergência. No Brasil, o CVV atende pelo 188.",
      alertLevel: "critical"
    }
  }
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

  if (["alegria"].includes(emotion)) {
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
  const riskAnalysis = detectRiskSignals(records)
  const advice = buildReportAdvice({
    total,
    averageIntensity,
    mostFrequentEmotion,
    intensityVariation
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
        intensity: record.intensity,
        trigger: record.trigger,
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

const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const detectRiskSignals = (records: Array<{ content: string | null }>) => {
  const signals = RISK_TERMS.flatMap((riskGroup) => {
    const matchedTerms = new Set<string>()
    let occurrences = 0

    records.forEach((record) => {
      if (!record.content) {
        return
      }

      const normalizedContent = normalizeText(record.content)

      riskGroup.terms.forEach((term) => {
        const normalizedTerm = normalizeText(term)

        if (normalizedContent.includes(normalizedTerm)) {
          matchedTerms.add(term)
          occurrences += 1
        }
      })
    })

    if (occurrences === 0) {
      return []
    }

    return {
      category: riskGroup.category,
      severity: riskGroup.severity,
      occurrences,
      terms: Array.from(matchedTerms)
    }
  })

  const hasCriticalRisk = signals.some((signal) => {
    return signal.severity === "critical"
  })

  const hasHighRisk = signals.some((signal) => {
    return signal.severity === "high"
  })

  const alertMessage = hasCriticalRisk
    ? "Foram identificados termos associados a risco grave ou sofrimento intenso. Este relatório não confirma uma situação de risco, mas recomenda buscar apoio imediatamente caso esses registros representem uma situação real e atual."
    : hasHighRisk
      ? "Foram identificados termos associados a violência, ameaça ou sofrimento relevante. Considere procurar apoio de pessoas de confiança, serviços especializados ou autoridades competentes se houver risco à segurança."
      : signals.length > 0
        ? "Foram identificados termos de atenção emocional. Observe se esses temas continuam aparecendo e considere buscar apoio caso estejam afetando sua rotina."
        : "Nenhum termo crítico foi identificado nos registros deste período."

  return {
    hasRisk: signals.length > 0,
    hasCriticalRisk,
    hasHighRisk,
    alertMessage,
    signals
  }
}

export {
  getEmotionDashboardSummary,
  getEmotionHistory,
  getEmotionRecordDetails,
  getEmotionReportByPeriod,
  getEmotionReports,
  createTextEmotionRecord
}

export type { ReportPeriod }
