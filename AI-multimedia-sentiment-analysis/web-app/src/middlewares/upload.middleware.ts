import multer from "multer"
import path from "node:path"

const avatarStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "public/uploads/avatars")
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const uniqueName = `${req.session.userId}-${Date.now()}${extension}`

    callback(null, uniqueName)
  }
})

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"]

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 1024 * 1024 * 2
  },
  fileFilter: (req, file, callback) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      callback(new Error("Envie uma imagem JPG, PNG ou WEBP de até 2 MB."))
      return
    }

    callback(null, true)
  }
})

export { uploadAvatar }
