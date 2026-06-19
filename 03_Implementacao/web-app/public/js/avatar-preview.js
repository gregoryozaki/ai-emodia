document.addEventListener("DOMContentLoaded", () => {
  const avatarInput = document.getElementById("avatarInput")
  const avatarPreviewImage = document.getElementById("avatarPreviewImage")
  const avatarPreviewFallback = document.getElementById("avatarPreviewFallback")
  const avatarFileLabel = document.getElementById("avatarFileLabel")

  if (!avatarInput) {
    return
  }

  avatarInput.addEventListener("change", () => {
    const file = avatarInput.files?.[0]

    if (!file) {
      return
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]

    if (!allowedTypes.includes(file.type)) {
      if (avatarFileLabel) {
        avatarFileLabel.textContent = "Formato inválido"
      }

      avatarInput.value = ""
      return
    }

    const imageUrl = URL.createObjectURL(file)

    if (avatarPreviewImage instanceof HTMLImageElement) {
      avatarPreviewImage.src = imageUrl
    } else if (avatarPreviewFallback) {
      const image = document.createElement("img")
      image.src = imageUrl
      image.alt = "Prévia da foto de perfil"
      image.id = "avatarPreviewImage"

      avatarPreviewFallback.replaceWith(image)
    }

    if (avatarFileLabel) {
      avatarFileLabel.textContent = file.name
    }
  })
})
