const openVideoCameraButton = document.getElementById("openVideoCamera")
const startVideoButton = document.getElementById("startVideoRecording")
const stopVideoButton = document.getElementById("stopVideoRecording")
const clearVideoButton = document.getElementById("clearVideoRecording")

const videoLiveBox = document.getElementById("videoLiveBox")
const videoLivePreview = document.getElementById("videoLivePreview")
const videoPreviewBox = document.getElementById("videoPreviewBox")
const videoRecordingPreview = document.getElementById("videoRecordingPreview")

const videoStatus = document.getElementById("videoRecorderStatus")
const videoHelper = document.getElementById("videoRecorderHelper")
const videoTimer = document.getElementById("videoRecorderTimer")
const videoVisual = document.getElementById("videoRecorderVisual")
const videoTranscriptionStatus = document.getElementById(
  "videoTranscriptionStatus"
)
const videoTranscript = document.getElementById("videoTranscript")
const videoAnalysisForm = document.getElementById("videoAnalysisForm")

let videoStream = null
let videoRecorder = null
let videoChunks = []
let currentVideoBlob = null
let videoTimerInterval = null
let videoRecordingSeconds = 0

const formatVideoTime = (seconds) => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0")
  const rest = String(seconds % 60).padStart(2, "0")

  return `${minutes}:${rest}`
}

const setVideoStatus = (status, helper) => {
  if (videoStatus) {
    videoStatus.textContent = status
  }

  if (videoHelper) {
    videoHelper.textContent = helper
  }
}

const showInitialVideoButtons = () => {
  openVideoCameraButton.hidden = false
  openVideoCameraButton.disabled = false

  startVideoButton.hidden = true
  startVideoButton.disabled = true

  stopVideoButton.hidden = true
  stopVideoButton.disabled = true

  clearVideoButton.hidden = true
  clearVideoButton.disabled = true
}

const showCameraReadyButtons = () => {
  openVideoCameraButton.hidden = true
  openVideoCameraButton.disabled = true

  startVideoButton.hidden = false
  startVideoButton.disabled = false
  startVideoButton.textContent = "🔴 Iniciar gravação"

  stopVideoButton.hidden = true
  stopVideoButton.disabled = true

  clearVideoButton.hidden = false
  clearVideoButton.disabled = false
}

const showVideoRecordingButtons = () => {
  openVideoCameraButton.hidden = true
  openVideoCameraButton.disabled = true

  startVideoButton.hidden = false
  startVideoButton.disabled = true

  stopVideoButton.hidden = false
  stopVideoButton.disabled = false

  clearVideoButton.hidden = true
  clearVideoButton.disabled = true
}

const showVideoProcessingButtons = () => {
  openVideoCameraButton.hidden = true
  openVideoCameraButton.disabled = true

  startVideoButton.hidden = false
  startVideoButton.disabled = true

  stopVideoButton.hidden = true
  stopVideoButton.disabled = true

  clearVideoButton.hidden = false
  clearVideoButton.disabled = true
}

const showVideoFinishedButtons = () => {
  openVideoCameraButton.hidden = true
  openVideoCameraButton.disabled = true

  startVideoButton.hidden = false
  startVideoButton.disabled = false
  startVideoButton.textContent = "📹 Gravar novamente"

  stopVideoButton.hidden = true
  stopVideoButton.disabled = true

  clearVideoButton.hidden = false
  clearVideoButton.disabled = false
}

const startVideoTimer = () => {
  videoRecordingSeconds = 0

  if (videoTimer) {
    videoTimer.textContent = "00:00"
  }

  videoTimerInterval = setInterval(() => {
    videoRecordingSeconds += 1

    if (videoTimer) {
      videoTimer.textContent = formatVideoTime(videoRecordingSeconds)
    }
  }, 1000)
}

const stopVideoTimer = () => {
  if (videoTimerInterval) {
    clearInterval(videoTimerInterval)
    videoTimerInterval = null
  }
}

const stopVideoStream = () => {
  if (!videoStream) {
    return
  }

  videoStream.getTracks().forEach((track) => {
    track.stop()
  })

  videoStream = null
}

const setVideoRecordingVisual = (isRecording) => {
  if (videoVisual) {
    videoVisual.classList.toggle("is-recording", isRecording)
  }
}

const showVideoTranscriptionStatus = (message) => {
  if (!videoTranscriptionStatus) {
    return
  }

  videoTranscriptionStatus.hidden = false
  videoTranscriptionStatus.textContent = message
}

const hideVideoTranscriptionStatus = () => {
  if (!videoTranscriptionStatus) {
    return
  }

  videoTranscriptionStatus.hidden = true
  videoTranscriptionStatus.textContent = ""
}

const showVideoForm = () => {
  if (videoAnalysisForm) {
    videoAnalysisForm.hidden = false
  }
}

const hideVideoForm = () => {
  if (videoAnalysisForm) {
    videoAnalysisForm.hidden = true
  }
}

const openVideoCamera = async () => {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })

    if (videoLivePreview) {
      videoLivePreview.srcObject = videoStream
    }

    if (videoLiveBox) {
      videoLiveBox.hidden = false
    }

    if (videoPreviewBox) {
      videoPreviewBox.hidden = true
    }

    hideVideoForm()
    hideVideoTranscriptionStatus()
    showCameraReadyButtons()

    setVideoStatus(
      "Câmera ligada",
      "Quando estiver pronto, clique em iniciar gravação."
    )
  } catch {
    showInitialVideoButtons()

    setVideoStatus(
      "Câmera ou microfone bloqueado",
      "Verifique as permissões do navegador para câmera e microfone."
    )
  }
}

const transcribeVideoRecording = async () => {
  if (!currentVideoBlob) {
    showVideoTranscriptionStatus("Nenhum vídeo disponível para transcrever.")
    return
  }

  showVideoProcessingButtons()
  showVideoForm()

  showVideoTranscriptionStatus(
    "Transcrevendo o áudio do vídeo automaticamente. Aguarde..."
  )

  if (videoTranscript) {
    videoTranscript.value = ""
    videoTranscript.placeholder =
      "Transcrevendo áudio do vídeo automaticamente..."
  }

  const formData = new FormData()
  formData.append("audio", currentVideoBlob, "emodia-video.webm")

  try {
    const response = await fetch("/analises/audio/transcrever", {
      method: "POST",
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Erro ao transcrever o áudio do vídeo.")
    }

    if (videoTranscript) {
      videoTranscript.value = data.transcript || ""
      videoTranscript.placeholder =
        "A transcrição automática do vídeo aparecerá aqui. Você poderá editar antes de enviar."
      videoTranscript.focus()
    }

    showVideoTranscriptionStatus(
      "Transcrição gerada. Revise o texto antes de enviar."
    )

    setVideoStatus(
      "Transcrição pronta",
      "Revise o texto gerado e clique em enviar."
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao gerar transcrição automática."

    showVideoTranscriptionStatus(
      `${message} Você pode preencher a transcrição manualmente.`
    )

    if (videoTranscript) {
      videoTranscript.placeholder =
        "Não foi possível gerar a transcrição automática. Digite a transcrição manualmente."
      videoTranscript.focus()
    }

    setVideoStatus(
      "Transcrição automática falhou",
      "Você ainda pode assistir ao vídeo e preencher a transcrição manualmente."
    )
  } finally {
    showVideoFinishedButtons()
  }
}

const startVideoRecording = async () => {
  if (!videoStream) {
    await openVideoCamera()
  }

  if (!videoStream) {
    return
  }

  videoChunks = []
  currentVideoBlob = null

  if (videoTranscript) {
    videoTranscript.value = ""
    videoTranscript.placeholder =
      "A transcrição automática do vídeo aparecerá aqui. Você poderá editar antes de enviar."
  }

  hideVideoForm()
  hideVideoTranscriptionStatus()

  videoRecorder = new MediaRecorder(videoStream)

  videoRecorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) {
      videoChunks.push(event.data)
    }
  })

  videoRecorder.addEventListener("stop", async () => {
    currentVideoBlob = new Blob(videoChunks, {
      type: "video/webm"
    })

    const videoUrl = URL.createObjectURL(currentVideoBlob)

    if (videoRecordingPreview) {
      videoRecordingPreview.src = videoUrl
    }

    if (videoPreviewBox) {
      videoPreviewBox.hidden = false
    }

    if (videoLiveBox) {
      videoLiveBox.hidden = true
    }

    stopVideoStream()
    setVideoRecordingVisual(false)

    setVideoStatus(
      "Gravação finalizada",
      "Assista à prévia enquanto o Emodia gera a transcrição."
    )

    await transcribeVideoRecording()
  })

  videoRecorder.start()
  startVideoTimer()
  showVideoRecordingButtons()
  setVideoRecordingVisual(true)

  setVideoStatus(
    "Gravando vídeo agora...",
    "Fale naturalmente. Clique em parar quando terminar."
  )
}

const stopVideoRecording = () => {
  if (!videoRecorder || videoRecorder.state === "inactive") {
    return
  }

  videoRecorder.stop()
  stopVideoTimer()
  showVideoProcessingButtons()
  setVideoRecordingVisual(false)
}

const clearVideoRecording = () => {
  videoChunks = []
  currentVideoBlob = null

  stopVideoStream()
  stopVideoTimer()
  setVideoRecordingVisual(false)

  if (videoLivePreview) {
    videoLivePreview.srcObject = null
  }

  if (videoRecordingPreview) {
    videoRecordingPreview.removeAttribute("src")
    videoRecordingPreview.load()
  }

  if (videoLiveBox) {
    videoLiveBox.hidden = true
  }

  if (videoPreviewBox) {
    videoPreviewBox.hidden = true
  }

  if (videoTranscript) {
    videoTranscript.value = ""
    videoTranscript.placeholder =
      "A transcrição automática do vídeo aparecerá aqui. Você poderá editar antes de enviar."
  }

  if (videoTimer) {
    videoTimer.textContent = "00:00"
  }

  hideVideoTranscriptionStatus()
  hideVideoForm()
  showInitialVideoButtons()

  setVideoStatus(
    "Câmera pronta para iniciar",
    "Clique em abrir câmera para preparar a gravação."
  )
}

if (
  openVideoCameraButton &&
  startVideoButton &&
  stopVideoButton &&
  clearVideoButton &&
  videoLivePreview &&
  videoRecordingPreview
) {
  hideVideoForm()
  showInitialVideoButtons()

  openVideoCameraButton.addEventListener("click", openVideoCamera)
  startVideoButton.addEventListener("click", startVideoRecording)
  stopVideoButton.addEventListener("click", stopVideoRecording)
  clearVideoButton.addEventListener("click", clearVideoRecording)
}
