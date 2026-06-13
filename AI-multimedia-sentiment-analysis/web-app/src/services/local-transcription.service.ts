import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
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

type LocalTranscriptionError = {
  error?: string
}

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFilePath)

const WEB_APP_ROOT = path.resolve(currentDirectory, "../..")
const PROJECT_ROOT = path.resolve(WEB_APP_ROOT, "..")

const resolveFromWebApp = (configuredPath: string) => {
  return path.resolve(WEB_APP_ROOT, configuredPath)
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
    throw new Error("O transcritor não retornou uma resposta JSON válida.")
  }

  return JSON.parse(jsonLine) as
    | LocalTranscriptionResult
    | LocalTranscriptionError
}

const validateTranscriptionResult = (
  value: LocalTranscriptionResult | LocalTranscriptionError
): LocalTranscriptionResult => {
  if (
    "error" in value &&
    typeof value.error === "string" &&
    value.error.trim()
  ) {
    throw new Error(value.error)
  }

  if (!("transcript" in value) || typeof value.transcript !== "string") {
    throw new Error("O transcritor retornou uma transcrição inválida.")
  }

  if (!value.transcript.trim()) {
    throw new Error("Nenhuma fala foi transcrita.")
  }

  return value
}

const transcribeAudioLocally = async (
  audioPath: string
): Promise<LocalTranscriptionResult> => {
  const transcriptionScriptPath = resolveFromWebApp(
    env.EMODIA_TRANSCRIPTION_SCRIPT_PATH
  )

  const resolvedAudioPath = path.resolve(audioPath)

  return new Promise((resolve, reject) => {
    const child = spawn(
      "conda",
      [
        "run",
        "--no-capture-output",
        "-n",
        env.EMODIA_CONDA_ENV,
        "python",
        transcriptionScriptPath,
        resolvedAudioPath,
        "--model",
        env.EMODIA_WHISPER_MODEL,
        "--device",
        env.EMODIA_WHISPER_DEVICE
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

    const finishWithResult = (result: LocalTranscriptionResult) => {
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
        new Error("Tempo limite excedido ao transcrever o áudio.")
      )
    }, env.EMODIA_TRANSCRIPTION_TIMEOUT_MS)

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString()
    })

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString()
    })

    child.on("error", (error) => {
      finishWithError(
        new Error(
          `Não foi possível iniciar o transcritor local: ${error.message}`,
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
            stderr.trim() ||
              stdout.trim() ||
              "Erro ao realizar a transcrição local."
          )
        )

        return
      }

      try {
        const parsed = extractJsonFromOutput(stdout)
        const result = validateTranscriptionResult(parsed)

        finishWithResult(result)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Resposta inválida do transcritor."

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

export { transcribeAudioLocally }

export type { LocalTranscriptionResult }
