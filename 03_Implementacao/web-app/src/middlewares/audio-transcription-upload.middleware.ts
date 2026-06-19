import crypto from "node:crypto"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import multer from "multer"
import type { ErrorRequestHandler } from "express"

const MAX_MEDIA_FILE_SIZE = 25 * 1024 * 1024

const temporaryMediaDirectory = path.join(os.tmpdir(), "emodia-media")

fs.mkdirSync(temporaryMediaDirectory, {
  recursive: true
})

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, temporaryMediaDirectory)
  },

  filename: (_req, file, callback) => {
    const originalExtension = path.extname(file.originalname).toLowerCase()

    const extension = originalExtension || ".webm"

    const filename = `${crypto.randomUUID()}${extension}`

    callback(null, filename)
  }
})

const isAcceptedMediaType = (mimetype: string) => {
  const normalizedMimeType = mimetype.toLowerCase()

  return (
    normalizedMimeType.startsWith("audio/") ||
    normalizedMimeType.startsWith("video/webm")
  )
}

const audioTranscriptionUpload = multer({
  storage,

  limits: {
    fileSize: MAX_MEDIA_FILE_SIZE,
    files: 1
  },

  fileFilter: (_req, file, callback) => {
    if (!isAcceptedMediaType(file.mimetype)) {
      callback(
        new Error(
          `Formato de mídia inválido: ${file.mimetype}. Envie áudio ou vídeo WebM.`
        )
      )
      return
    }

    callback(null, true)
  }
})

const handleMediaUploadError: ErrorRequestHandler = (error, _req, res, next) => {
  if (!error) {
    next()
    return
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Arquivo muito grande. Envie uma mídia de até 25 MB."
        : error.code === "LIMIT_UNEXPECTED_FILE"
          ? "Campo de arquivo inválido para esta operação."
          : "Não foi possível receber o arquivo enviado."

    res.status(400).json({ message })
    return
  }

  if (error instanceof Error) {
    res.status(400).json({ message: error.message })
    return
  }

  res.status(400).json({
    message: "Erro ao processar o arquivo enviado."
  })
}

export { audioTranscriptionUpload, handleMediaUploadError }
