import crypto from "node:crypto"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import multer from "multer"

const temporaryAudioDirectory = path.join(os.tmpdir(), "emodia-audio")

fs.mkdirSync(temporaryAudioDirectory, {
  recursive: true
})

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, temporaryAudioDirectory)
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname) || ".webm"
    const filename = `${crypto.randomUUID()}${extension}`

    callback(null, filename)
  }
})

const audioTranscriptionUpload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    const isAudio = file.mimetype.startsWith("audio/")
    const isWebm = file.mimetype === "video/webm"

    if (!isAudio && !isWebm) {
      callback(new Error("Envie um arquivo de áudio válido."))
      return
    }

    callback(null, true)
  }
})

export { audioTranscriptionUpload }
