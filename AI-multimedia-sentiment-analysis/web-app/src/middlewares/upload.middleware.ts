import fs from "node:fs"
import path from "node:path"

import multer from "multer"

const AVATAR_DIRECTORY = path.resolve(
  process.cwd(),
  "public",
  "uploads",
  "avatars"
)

fs.mkdirSync(AVATAR_DIRECTORY, {
  recursive: true
})

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, AVATAR_DIRECTORY)
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const userId = req.session.userId ?? "anonymous"
    const uniqueName = `${userId}-${Date.now()}${extension}`

    callback(null, uniqueName)
  }
})

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"])

const uploadAvatar = multer({
  storage: avatarStorage,

  limits: {
    fileSize: 2 * 1024 * 1024
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      callback(new Error("Envie uma imagem JPG, PNG ou WEBP de até 2 MB."))
      return
    }

    callback(null, true)
  }
})

export { uploadAvatar }
