type RiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

type RiskSignal = {
  category: string
  severity: Exclude<RiskLevel, "NONE">
  terms: string[]
}

type RiskAnalysisResult = {
  riskLevel: RiskLevel
  riskMessage: string | null
  riskTerms: string | null
  signals: Array<{
    category: string
    severity: Exclude<RiskLevel, "NONE">
    terms: string[]
    occurrences: number
  }>
}

const RISK_SIGNALS: RiskSignal[] = [
  {
    category: "Risco de autoagressão ou suicídio",
    severity: "CRITICAL",
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
    category: "Abuso ou violência sexual",
    severity: "CRITICAL",
    terms: [
      "abuso sexual",
      "violência sexual",
      "violencia sexual",
      "estupro",
      "assédio sexual",
      "assedio sexual",
      "me forçou",
      "me forcou",
      "tocou em mim"
    ]
  },
  {
    category: "Violência, ameaça ou agressão",
    severity: "HIGH",
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
      "fui atacado",
      "fui atacada",
      "medo de apanhar"
    ]
  },
  {
    category: "Sofrimento emocional intenso",
    severity: "MEDIUM",
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

const RISK_PRIORITY: Record<RiskLevel, number> = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
}

const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const getHighestRiskLevel = (levels: RiskLevel[]) => {
  return levels.reduce<RiskLevel>((highest, current) => {
    return RISK_PRIORITY[current] > RISK_PRIORITY[highest] ? current : highest
  }, "NONE")
}

const buildRiskMessage = (riskLevel: RiskLevel) => {
  if (riskLevel === "CRITICAL") {
    return "Foram identificados termos associados a sofrimento intenso, autoagressão, abuso ou risco grave. O Emodia não realiza diagnóstico, mas recomenda buscar apoio imediatamente caso isso represente uma situação real e atual. Converse com alguém de confiança, procure atendimento profissional ou acione um serviço de emergência. No Brasil, o CVV atende pelo 188."
  }

  if (riskLevel === "HIGH") {
    return "Foram identificados termos associados a violência, ameaça ou agressão. Caso exista risco à sua segurança, procure apoio de pessoas de confiança, serviços especializados ou autoridades competentes."
  }

  if (riskLevel === "MEDIUM") {
    return "Foram identificados termos de sofrimento emocional relevante. Observe se esses sentimentos continuam aparecendo e considere conversar com alguém de confiança ou buscar apoio profissional."
  }

  if (riskLevel === "LOW") {
    return "Foram identificados sinais leves de atenção emocional. Continue acompanhando seus registros para entender melhor seus gatilhos e padrões."
  }

  return null
}

const analyzeRiskSignals = (content: string): RiskAnalysisResult => {
  const normalizedContent = normalizeText(content)

  const signals = RISK_SIGNALS.flatMap((signal) => {
    const matchedTerms = signal.terms.filter((term) => {
      return normalizedContent.includes(normalizeText(term))
    })

    if (matchedTerms.length === 0) {
      return []
    }

    return {
      category: signal.category,
      severity: signal.severity,
      terms: matchedTerms,
      occurrences: matchedTerms.length
    }
  })

  const riskLevel = getHighestRiskLevel(
    signals.map((signal) => signal.severity)
  )

  const allTerms = signals.flatMap((signal) => signal.terms)

  return {
    riskLevel,
    riskMessage: buildRiskMessage(riskLevel),
    riskTerms: allTerms.length > 0 ? allTerms.join(", ") : null,
    signals
  }
}

export { analyzeRiskSignals }

export type { RiskAnalysisResult, RiskLevel }
