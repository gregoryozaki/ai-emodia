import { spawn } from "node:child_process"
import path from "node:path"

import { env } from "../config/env.js"

type LocalTranscriptionResult = {
  transcript: string
  language?: string
  language_probability?: number
  duration?: number
  device?: string
  model?: string
}

const PROJECT_ROOT = path.resolve(process.cwd(), "..")

const TRANSCRIPTION_SCRIPT_PATH = path.join(
  PROJECT_ROOT,
  "ml",
  "src",
  "transcription",
  "transcribe_audio.py"
)

const transcribeAudioLocally = async (
  audioPath: string
): Promise<LocalTranscriptionResult> => {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "conda",
      [
        "run",
        "-n",
        env.EMODIA_CONDA_ENV,
        "python",
        TRANSCRIPTION_SCRIPT_PATH,
        audioPath,
        "--model",
        env.EMODIA_WHISPER_MODEL,
        "--device",
        env.EMODIA_WHISPER_DEVICE
      ],
      {
        cwd: PROJECT_ROOT
      }
    )

    let stdout = ""
    let stderr = ""

    const timeout = setTimeout(() => {
      child.kill("SIGKILL")
      reject(new Error("Tempo limite excedido ao transcrever o áudio."))
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
            stderr.trim() || stdout.trim() || "Erro ao transcrever áudio."
          )
        )
        return
      }

      try {
        const parsed = JSON.parse(stdout.trim()) as LocalTranscriptionResult & {
          error?: string
        }

        if (parsed.error) {
          reject(new Error(parsed.error))
          return
        }

        if (!parsed.transcript?.trim()) {
          reject(new Error("Nenhuma fala foi transcrita."))
          return
        }

        resolve(parsed)
      } catch {
        reject(
          new Error(
            `Resposta inválida do transcritor. STDERR: ${stderr.trim()} STDOUT: ${stdout.trim()}`
          )
        )
      }
    })
  })
}

export { transcribeAudioLocally }

export type { LocalTranscriptionResult }
