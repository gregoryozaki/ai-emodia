type EmotionType =
  | "ALEGRIA"
  | "TRISTEZA"
  | "RAIVA"
  | "MEDO"
  | "NOJO"
  | "ANSIEDADE"

type TextEmotionAnalysisResult = {
  emotion: EmotionType
  intensity: number
  triggers: string[]
  summary: string
}

type EmotionKeywordGroup = {
  emotion: EmotionType
  keywords: string[]
}

const emotionKeywordGroups: EmotionKeywordGroup[] = [
  {
    emotion: "ALEGRIA",
    keywords: [
      "feliz",
      "alegre",
      "animado",
      "animada",
      "contente",
      "grato",
      "grata",
      "orgulhoso",
      "orgulhosa",
      "bem",
      "leve",
      "motivado",
      "motivada"
    ]
  },
  {
    emotion: "TRISTEZA",
    keywords: [
      "triste",
      "sozinho",
      "sozinha",
      "chateado",
      "chateada",
      "desanimado",
      "desanimada",
      "vazio",
      "vazia",
      "chorar",
      "cansado",
      "cansada",
      "sem vontade"
    ]
  },
  {
    emotion: "RAIVA",
    keywords: [
      "raiva",
      "irritado",
      "irritada",
      "ódio",
      "estressado",
      "estressada",
      "explodir",
      "revoltado",
      "revoltada",
      "nervoso",
      "nervosa"
    ]
  },
  {
    emotion: "MEDO",
    keywords: [
      "medo",
      "assustado",
      "assustada",
      "inseguro",
      "insegura",
      "pânico",
      "apavorado",
      "apavorada",
      "ameaça",
      "perigo"
    ]
  },
  {
    emotion: "NOJO",
    keywords: [
      "nojo",
      "repulsa",
      "nojento",
      "nojenta",
      "aversão",
      "desgosto",
      "insuportável"
    ]
  },
  {
    emotion: "ANSIEDADE",
    keywords: [
      "ansioso",
      "ansiosa",
      "ansiedade",
      "preocupado",
      "preocupada",
      "preocupação",
      "nervosismo",
      "cobrança",
      "pressão",
      "sobrecarga",
      "prova",
      "prazo",
      "futuro",
      "não consigo dormir",
      "sem dormir"
    ]
  }
]

const triggerKeywords: Record<string, string[]> = {
  trabalho: ["trabalho", "emprego", "chefe", "empresa", "reunião", "demanda"],
  estudo: [
    "estudo",
    "faculdade",
    "universidade",
    "prova",
    "atividade",
    "nota",
    "tcc"
  ],
  família: ["família", "mãe", "pai", "irmão", "irmã", "casa"],
  relacionamento: [
    "namoro",
    "namorada",
    "namorado",
    "relacionamento",
    "término"
  ],
  sono: ["sono", "dormir", "insônia", "sem dormir", "cansado", "cansada"],
  dinheiro: ["dinheiro", "conta", "dívida", "salário", "financeiro"],
  saúde: ["saúde", "doença", "dor", "médico", "hospital"],
  futuro: ["futuro", "incerteza", "medo do futuro", "não sei o que fazer"]
}

const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const countMatches = (text: string, keywords: string[]) => {
  return keywords.reduce((total, keyword) => {
    const normalizedKeyword = normalizeText(keyword)

    if (text.includes(normalizedKeyword)) {
      return total + 1
    }

    return total
  }, 0)
}

const detectEmotion = (normalizedText: string): EmotionType => {
  const scores = emotionKeywordGroups.map((group) => {
    return {
      emotion: group.emotion,
      score: countMatches(normalizedText, group.keywords)
    }
  })

  const sortedScores = scores.sort((a, b) => b.score - a.score)
  const bestMatch = sortedScores[0]

  if (!bestMatch || bestMatch.score === 0) {
    return "ANSIEDADE"
  }

  return bestMatch.emotion
}

const detectTriggers = (normalizedText: string) => {
  return Object.entries(triggerKeywords)
    .filter(([, keywords]) => countMatches(normalizedText, keywords) > 0)
    .map(([trigger]) => trigger)
}

const estimateIntensity = (text: string, triggers: string[]) => {
  const normalizedText = normalizeText(text)

  const strongWords = [
    "muito",
    "demais",
    "sempre",
    "nunca",
    "insuportavel",
    "desesperado",
    "desesperada",
    "horrivel",
    "péssimo",
    "pessimo",
    "crise",
    "panico",
    "pânico"
  ]

  let intensity = 2

  if (text.length > 180) {
    intensity += 1
  }

  if (triggers.length >= 2) {
    intensity += 1
  }

  if (countMatches(normalizedText, strongWords) >= 1) {
    intensity += 1
  }

  return Math.min(intensity, 5)
}

const createSummary = (
  emotion: EmotionType,
  intensity: number,
  triggers: string[]
) => {
  const emotionText: Record<EmotionType, string> = {
    ALEGRIA: "O relato indica predominância de emoções positivas.",
    TRISTEZA:
      "O relato indica sinais de tristeza, desânimo ou queda de energia emocional.",
    RAIVA: "O relato indica irritação, frustração ou tensão emocional.",
    MEDO: "O relato indica insegurança, medo ou sensação de ameaça.",
    NOJO: "O relato indica rejeição, repulsa ou forte desconforto com alguma situação.",
    ANSIEDADE: "O relato indica preocupação, tensão ou sobrecarga emocional."
  }

  const triggerText =
    triggers.length > 0
      ? ` Possíveis gatilhos identificados: ${triggers.join(", ")}.`
      : " Nenhum gatilho específico foi identificado com clareza."

  return `${emotionText[emotion]} Intensidade estimada: ${intensity}/5.${triggerText}`
}

const analyzeTextEmotion = (content: string): TextEmotionAnalysisResult => {
  const normalizedText = normalizeText(content)

  const emotion = detectEmotion(normalizedText)
  const triggers = detectTriggers(normalizedText)
  const intensity = estimateIntensity(content, triggers)
  const summary = createSummary(emotion, intensity, triggers)

  return {
    emotion,
    intensity,
    triggers,
    summary
  }
}

export { analyzeTextEmotion }

export type { EmotionType, TextEmotionAnalysisResult }
