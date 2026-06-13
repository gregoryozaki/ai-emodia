import { execFile } from "node:child_process"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { promisify } from "node:util"

type EmotionType =
  | "ALEGRIA"
  | "TRISTEZA"
  | "RAIVA"
  | "MEDO"
  | "NOJO"
  | "ANSIEDADE"

type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH"

type TextEmotionScores = Record<EmotionType, number>

type BertimbauPrediction = {
  emotion: EmotionType
  emodiaEmotion: EmotionType | "INDEFINIDO"
  confidence: number
  confidencePercent: number
  confidenceLevel: ConfidenceLevel
  accepted: boolean
  scores: Partial<TextEmotionScores>
  model: string
  device: string
  maxLength: number
  warning: string
}

type TextEmotionAnalysisResult = {
  emotion: EmotionType
  intensity: number
  triggers: string[]
  summary: string
  confidence: number
  confidenceLevel: ConfidenceLevel
  scores: Partial<TextEmotionScores>
  model: string
  warning: string
}

const execFileAsync = promisify(execFile)

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFilePath)

const projectRoot = path.resolve(currentDirectory, "../../..")

const predictorScriptPath = path.join(
  projectRoot,
  "ml",
  "src",
  "nlp",
  "predict_text_emotion.py"
)

const validEmotions: EmotionType[] = [
  "ALEGRIA",
  "TRISTEZA",
  "RAIVA",
  "MEDO",
  "NOJO",
  "ANSIEDADE"
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

    return text.includes(normalizedKeyword) ? total + 1 : total
  }, 0)
}

const detectTriggers = (normalizedText: string) => {
  return Object.entries(triggerKeywords)
    .filter(([, keywords]) => {
      return countMatches(normalizedText, keywords) > 0
    })
    .map(([trigger]) => trigger)
}

const estimateIntensity = (
  text: string,
  triggers: string[],
  confidence: number
) => {
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
    "pessimo",
    "crise",
    "panico"
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

  if (confidence >= 0.9) {
    intensity += 1
  }

  return Math.min(intensity, 5)
}

const createSummary = (
  emotion: EmotionType,
  intensity: number,
  triggers: string[],
  confidenceLevel: ConfidenceLevel
) => {
  const emotionText: Record<EmotionType, string> = {
    ALEGRIA: "O relato apresenta sinais compatíveis com uma emoção positiva.",
    TRISTEZA: "O relato apresenta sinais compatíveis com tristeza ou desânimo.",
    RAIVA:
      "O relato apresenta sinais compatíveis com irritação, frustração ou raiva.",
    MEDO: "O relato apresenta sinais compatíveis com medo, insegurança ou ameaça.",
    NOJO: "O relato apresenta sinais compatíveis com rejeição, repulsa ou desconforto.",
    ANSIEDADE:
      "O relato apresenta sinais compatíveis com preocupação, tensão ou ansiedade."
  }

  const confidenceText: Record<ConfidenceLevel, string> = {
    HIGH: "A confiança da classificação foi alta.",
    MEDIUM: "A confiança da classificação foi moderada.",
    LOW: "A confiança da classificação foi baixa."
  }

  const triggerText =
    triggers.length > 0
      ? ` Possíveis gatilhos identificados: ${triggers.join(", ")}.`
      : " Nenhum gatilho específico foi identificado com clareza."

  return [
    emotionText[emotion],
    confidenceText[confidenceLevel],
    `Intensidade estimada: ${intensity}/5.`,
    triggerText
  ].join(" ")
}

const isEmotionType = (emotion: string): emotion is EmotionType => {
  return validEmotions.includes(emotion as EmotionType)
}

const extractJsonFromOutput = (stdout: string) => {
  const lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const jsonLine = [...lines]
    .reverse()
    .find((line) => line.startsWith("{") && line.endsWith("}"))

  if (!jsonLine) {
    throw new Error("O classificador BERTimbau não retornou um JSON válido.")
  }

  return JSON.parse(jsonLine) as unknown
}

const validatePrediction = (value: unknown): BertimbauPrediction => {
  if (!value || typeof value !== "object") {
    throw new Error("O classificador retornou uma resposta inválida.")
  }

  const prediction = value as Partial<BertimbauPrediction> & {
    error?: unknown
  }

  if (typeof prediction.error === "string" && prediction.error.trim()) {
    throw new Error(prediction.error)
  }

  if (
    typeof prediction.emotion !== "string" ||
    !isEmotionType(prediction.emotion)
  ) {
    throw new Error("O classificador retornou uma emoção desconhecida.")
  }

  if (
    typeof prediction.confidence !== "number" ||
    !Number.isFinite(prediction.confidence)
  ) {
    throw new Error("O classificador retornou uma confiança inválida.")
  }

  if (
    prediction.confidenceLevel !== "LOW" &&
    prediction.confidenceLevel !== "MEDIUM" &&
    prediction.confidenceLevel !== "HIGH"
  ) {
    throw new Error("O classificador retornou um nível de confiança inválido.")
  }

  return {
    emotion: prediction.emotion,
    emodiaEmotion:
      prediction.emodiaEmotion === "INDEFINIDO" ||
      (typeof prediction.emodiaEmotion === "string" &&
        isEmotionType(prediction.emodiaEmotion))
        ? prediction.emodiaEmotion
        : prediction.emotion,
    confidence: prediction.confidence,
    confidencePercent:
      typeof prediction.confidencePercent === "number"
        ? prediction.confidencePercent
        : prediction.confidence * 100,
    confidenceLevel: prediction.confidenceLevel,
    accepted: prediction.accepted === true,
    scores:
      prediction.scores && typeof prediction.scores === "object"
        ? prediction.scores
        : {},
    model:
      typeof prediction.model === "string"
        ? prediction.model
        : "BERTimbau Emodia V2",
    device:
      typeof prediction.device === "string" ? prediction.device : "unknown",
    maxLength:
      typeof prediction.maxLength === "number" ? prediction.maxLength : 128,
    warning:
      typeof prediction.warning === "string"
        ? prediction.warning
        : "A classificação emocional é apenas uma estimativa."
  }
}

const runBertimbauPrediction = async (
  content: string
): Promise<BertimbauPrediction> => {
  try {
    const { stdout } = await execFileAsync(
      "conda",
      [
        "run",
        "--no-capture-output",
        "-n",
        "emodia-ml",
        "python",
        predictorScriptPath,
        content
      ],
      {
        cwd: projectRoot,
        timeout: 120_000,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          HF_HUB_DISABLE_PROGRESS_BARS: "1",
          TOKENIZERS_PARALLELISM: "false"
        }
      }
    )

    const parsedOutput = extractJsonFromOutput(stdout)

    return validatePrediction(parsedOutput)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao executar o BERTimbau."

    throw new Error(`Não foi possível analisar a emoção do texto: ${message}`, {
      cause: error
    })
  }
}

const analyzeTextEmotion = async (
  content: string
): Promise<TextEmotionAnalysisResult> => {
  const trimmedContent = content.trim()

  if (!trimmedContent) {
    throw new Error("Informe um texto para análise.")
  }

  const prediction = await runBertimbauPrediction(trimmedContent)

  const normalizedText = normalizeText(trimmedContent)
  const triggers = detectTriggers(normalizedText)

  const emotion = prediction.emotion

  const intensity = estimateIntensity(
    trimmedContent,
    triggers,
    prediction.confidence
  )

  const summary = createSummary(
    emotion,
    intensity,
    triggers,
    prediction.confidenceLevel
  )

  return {
    emotion,
    intensity,
    triggers,
    summary,
    confidence: prediction.confidence,
    confidenceLevel: prediction.confidenceLevel,
    scores: prediction.scores,
    model: prediction.model,
    warning: prediction.warning
  }
}

export { analyzeTextEmotion }
