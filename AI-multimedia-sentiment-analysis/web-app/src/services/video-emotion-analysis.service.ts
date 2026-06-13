import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import path from "node:path"

import { env } from "../config/env.js"

type VisualConfidenceLevel = "LOW" | "MEDIUM" | "HIGH"

type VisualEmotionAnalysisResult = {
  emotion: string
  emodiaEmotion: string
  confidence: number
  confidencePercent?: number
  confidenceLevel: VisualConfidenceLevel
  topGap?: number
  averageScores?: Record<string, number>
  emotionCounts?: Record<string, number>
  sampledFrames?: number
  framesAnalyzed?: number
  framesWithoutFace?: number
  frameIntervalSeconds?: number
  fps?: number
  totalFrames?: number
  durationSeconds?: number
  model?: string
  modelPath?: string
  labelsPath?: string
  device?: string
  input?: string
  interpretation?: string
  warning?: string
  frameResults?: Array<{
    frameIndex: number
    timeSeconds: number
    emotion: string
    emodiaEmotion: string
    confidence: number
    confidenceLevel: VisualConfidenceLevel
    topGap: number
    faceBox?: {
      x: number
      y: number
      width: number
      height: number
    }
    scores: Record<string, number>
  }>
}

type VisualAnalysisError = {
  error?: string
}

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFilePath)

const WEB_APP_ROOT = path.resolve(currentDirectory, "../..")
const PROJECT_ROOT = path.resolve(WEB_APP_ROOT, "..")

const resolveFromWebApp = (configuredPath: string) => {
  return path.resolve(WEB_APP_ROOT, configuredPath)
}

const parseJsonOutput = (stdout: string): VisualEmotionAnalysisResult => {
  const lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const jsonLine = [...lines].reverse().find((line) => {
    return line.startsWith("{") && line.endsWith("}")
  })

  if (!jsonLine) {
    throw new Error("Nenhuma resposta JSON foi retornada pela análise visual.")
  }

  const parsed = JSON.parse(jsonLine) as
    | VisualEmotionAnalysisResult
    | VisualAnalysisError

  if (
    "error" in parsed &&
    typeof parsed.error === "string" &&
    parsed.error.trim()
  ) {
    throw new Error(parsed.error)
  }

  if (!("emotion" in parsed) || typeof parsed.emotion !== "string") {
    throw new Error("A análise visual retornou uma emoção inválida.")
  }

  if (
    !("emodiaEmotion" in parsed) ||
    typeof parsed.emodiaEmotion !== "string"
  ) {
    throw new Error("A análise visual retornou um mapeamento inválido.")
  }

  if (!("confidence" in parsed) || typeof parsed.confidence !== "number") {
    throw new Error("A análise visual retornou uma confiança inválida.")
  }

  if (
    !("confidenceLevel" in parsed) ||
    (parsed.confidenceLevel !== "LOW" &&
      parsed.confidenceLevel !== "MEDIUM" &&
      parsed.confidenceLevel !== "HIGH")
  ) {
    throw new Error("A análise visual retornou um nível de confiança inválido.")
  }

  return parsed
}

const analyzeVideoEmotion = async (
  videoPath: string
): Promise<VisualEmotionAnalysisResult> => {
  if (!env.EMODIA_CV_ENABLED) {
    throw new Error("A análise visual está desabilitada.")
  }

  const videoEmotionScriptPath = resolveFromWebApp(
    env.EMODIA_CV_VIDEO_SCRIPT_PATH
  )

  const modelPath = resolveFromWebApp(env.EMODIA_CV_MODEL_PATH)

  const labelsPath = resolveFromWebApp(env.EMODIA_CV_LABELS_PATH)

  const resolvedVideoPath = path.resolve(videoPath)

  return new Promise((resolve, reject) => {
    const child = spawn(
      "conda",
      [
        "run",
        "--no-capture-output",
        "-n",
        env.EMODIA_CONDA_ENV,
        "python",
        videoEmotionScriptPath,
        resolvedVideoPath,
        "--model-path",
        modelPath,
        "--labels-path",
        labelsPath,
        "--device",
        env.EMODIA_CV_DEVICE,
        "--interval",
        String(env.EMODIA_CV_FRAME_INTERVAL_SECONDS)
      ],
      {
        cwd: PROJECT_ROOT,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1"
        }
      }
    )

    let stdout = ""
    let stderr = ""
    let finished = false

    const finishWithError = (error: Error) => {
      if (finished) {
        return
      }

      finished = true
      clearTimeout(timeout)
      reject(error)
    }

    const finishWithResult = (result: VisualEmotionAnalysisResult) => {
      if (finished) {
        return
      }

      finished = true
      clearTimeout(timeout)
      resolve(result)
    }

    const timeout = setTimeout(() => {
      child.kill("SIGKILL")

      finishWithError(
        new Error("Tempo limite excedido ao analisar emoção visual.")
      )
    }, env.EMODIA_CV_TIMEOUT_MS)

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString()
    })

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString()
    })

    child.on("error", (error) => {
      finishWithError(
        new Error(
          `Não foi possível iniciar a análise visual. Verifique se o Conda está instalado e se o ambiente ${env.EMODIA_CONDA_ENV} existe: ${error.message}`,
          {
            cause: error
          }
        )
      )
    })

    child.on("close", (code) => {
      if (finished) {
        return
      }

      if (code !== 0) {
        finishWithError(
          new Error(
            stderr.trim() || stdout.trim() || "Erro ao analisar emoção visual."
          )
        )

        return
      }

      try {
        const result = parseJsonOutput(stdout)
        finishWithResult(result)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Resposta inválida da análise visual."

        finishWithError(
          new Error(
            `${message} STDERR: ${stderr.trim()} STDOUT: ${stdout.trim()}`,
            {
              cause: error
            }
          )
        )
      }
    })
  })
}

export { analyzeVideoEmotion }

export type { VisualConfidenceLevel, VisualEmotionAnalysisResult }
