import { spawn } from "node:child_process"
import path from "node:path"

import { env } from "../config/env.js"

type VisualEmotionAnalysisResult = {
  emotion: string
  emodiaEmotion: string
  confidence: number
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH"
  topGap?: number
  averageScores?: Record<string, number>
  emotionCounts?: Record<string, number>
  framesAnalyzed?: number
  frameIntervalSeconds?: number
  model?: string
  input?: string
  interpretation?: string
  warning?: string
}

const PROJECT_ROOT = path.resolve(process.cwd(), "..")

const VIDEO_EMOTION_SCRIPT_PATH = path.join(
  PROJECT_ROOT,
  "ml",
  "src",
  "cv",
  "predict_video_emotion.py"
)

const analyzeVideoEmotion = async (
  videoPath: string
): Promise<VisualEmotionAnalysisResult> => {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "conda",
      [
        "run",
        "-n",
        env.EMODIA_CONDA_ENV,
        "python",
        VIDEO_EMOTION_SCRIPT_PATH,
        videoPath,
        "--interval",
        "0.5"
      ],
      {
        cwd: PROJECT_ROOT
      }
    )

    let stdout = ""
    let stderr = ""

    const timeout = setTimeout(() => {
      child.kill("SIGKILL")
      reject(new Error("Tempo limite excedido ao analisar emoção visual."))
    }, 120_000)

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString()
    })

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString()
    })

    child.on("error", (error) => {
      clearTimeout(timeout)
      reject(error)
    })

    child.on("close", (code) => {
      clearTimeout(timeout)

      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() || stdout.trim() || "Erro ao analisar emoção visual."
          )
        )
        return
      }
      try {
        const lines = stdout
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)

        const jsonLine = lines.at(-1)

        if (!jsonLine) {
          reject(
            new Error(
              `Nenhuma resposta JSON foi retornada pela análise visual. STDERR: ${stderr.trim()} STDOUT: ${stdout.trim()}`
            )
          )
          return
        }

        const parsed = JSON.parse(jsonLine) as VisualEmotionAnalysisResult & {
          error?: string
        }

        if (parsed.error) {
          reject(new Error(parsed.error))
          return
        }

        resolve(parsed)
      } catch {
        reject(
          new Error(
            `Resposta inválida da análise visual. STDERR: ${stderr.trim()} STDOUT: ${stdout.trim()}`
          )
        )
      }
    })
  })
}

export { analyzeVideoEmotion }
export type { VisualEmotionAnalysisResult }
