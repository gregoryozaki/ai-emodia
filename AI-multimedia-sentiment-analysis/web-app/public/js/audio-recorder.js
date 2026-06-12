const startAudioButton = document.getElementById("startAudioRecording")
const stopAudioButton = document.getElementById("stopAudioRecording")
const clearAudioButton = document.getElementById("clearAudioRecording")

const audioPreview = document.getElementById("audioRecordingPreview")
const audioPreviewBox = document.getElementById("audioPreviewBox")
const audioStatus = document.getElementById("audioRecorderStatus")
const audioHelper = document.getElementById("audioRecorderHelper")
const audioTimer = document.getElementById("audioRecorderTimer")
const audioVisual = document.getElementById("audioRecorderVisual")
const transcriptionStatus = document.getElementById("audioTranscriptionStatus")
const audioTranscript = document.getElementById("audioTranscript")
const audioAnalysisForm = document.getElementById("audioAnalysisForm")

let audioStream = null
let mediaRecorder = null
let audioChunks = []
let currentAudioBlob = null
let timerInterval = null
let recordingSeconds = 0

const formatTime = (seconds) => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0")
  const rest = String(seconds % 60).padStart(2, "0")

  return `${minutes}:${rest}`
}

const setStatus = (status, helper) => {
  if (audioStatus) {
    audioStatus.textContent = status
  }

  if (audioHelper) {
    audioHelper.textContent = helper
  }
}

const showOnlyStartButton = () => {
  startAudioButton.hidden = false
  startAudioButton.disabled = false
  startAudioButton.textContent = "🎙️ Iniciar gravação"

  stopAudioButton.hidden = true
  stopAudioButton.disabled = true

  clearAudioButton.hidden = true
  clearAudioButton.disabled = true
}

const showRecordingButtons = () => {
  startAudioButton.hidden = false
  startAudioButton.disabled = true

  stopAudioButton.hidden = false
  stopAudioButton.disabled = false

  clearAudioButton.hidden = true
  clearAudioButton.disabled = true
}

const showFinishedButtons = () => {
  startAudioButton.hidden = false
  startAudioButton.disabled = false
  startAudioButton.textContent = "🎙️ Gravar novamente"

  stopAudioButton.hidden = true
  stopAudioButton.disabled = true

  clearAudioButton.hidden = false
  clearAudioButton.disabled = false
}

const showProcessingButtons = () => {
  startAudioButton.disabled = true
  stopAudioButton.hidden = true
  stopAudioButton.disabled = true
  clearAudioButton.hidden = false
  clearAudioButton.disabled = true
}

const startTimer = () => {
  recordingSeconds = 0

  if (audioTimer) {
    audioTimer.textContent = "00:00"
  }

  timerInterval = setInterval(() => {
    recordingSeconds += 1

    if (audioTimer) {
      audioTimer.textContent = formatTime(recordingSeconds)
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const stopAudioStream = () => {
  if (!audioStream) {
    return
  }

  audioStream.getTracks().forEach((track) => {
    track.stop()
  })

  audioStream = null
}

const setRecordingVisual = (isRecording) => {
  if (audioVisual) {
    audioVisual.classList.toggle("is-recording", isRecording)
  }
}

const showTranscriptionStatus = (message) => {
  if (!transcriptionStatus) {
    return
  }

  transcriptionStatus.hidden = false
  transcriptionStatus.textContent = message
}

const hideTranscriptionStatus = () => {
  if (!transcriptionStatus) {
    return
  }

  transcriptionStatus.hidden = true
  transcriptionStatus.textContent = ""
}

const showAudioForm = () => {
  if (audioAnalysisForm) {
    audioAnalysisForm.hidden = false
  }
}

const hideAudioForm = () => {
  if (audioAnalysisForm) {
    audioAnalysisForm.hidden = true
  }
}

const transcribeAudioRecording = async () => {
  if (!currentAudioBlob) {
    showTranscriptionStatus("Nenhum áudio disponível para transcrever.")
    return
  }

  showProcessingButtons()
  showAudioForm()

  showTranscriptionStatus("Transcrevendo áudio automaticamente. Aguarde...")

  if (audioTranscript) {
    audioTranscript.value = ""
    audioTranscript.placeholder = "Transcrevendo áudio automaticamente..."
  }

  const formData = new FormData()
  formData.append("audio", currentAudioBlob, "emodia-audio.webm")

  try {
    const response = await fetch("/analises/audio/transcrever", {
      method: "POST",
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Erro ao transcrever áudio.")
    }

    if (audioTranscript) {
      audioTranscript.value = data.transcript || ""
      audioTranscript.placeholder =
        "A transcrição automática aparecerá aqui. Você poderá editar antes de enviar."
      audioTranscript.focus()
    }

    showTranscriptionStatus(
      "Transcrição gerada. Revise o texto antes de enviar."
    )

    setStatus("Transcrição pronta", "Revise o texto gerado e clique em enviar.")
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao gerar transcrição automática."

    showTranscriptionStatus(
      `${message} Você pode preencher a transcrição manualmente.`
    )

    if (audioTranscript) {
      audioTranscript.placeholder =
        "Não foi possível gerar a transcrição automática. Digite a transcrição manualmente."
      audioTranscript.focus()
    }

    setStatus(
      "Transcrição automática falhou",
      "Você ainda pode ouvir o áudio e preencher a transcrição manualmente."
    )
  } finally {
    showFinishedButtons()
  }
}

const startAudioRecording = async () => {
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })

    audioChunks = []
    currentAudioBlob = null

    if (audioTranscript) {
      audioTranscript.value = ""
      audioTranscript.placeholder =
        "A transcrição automática aparecerá aqui. Você poderá editar antes de enviar."
    }

    hideAudioForm()

    mediaRecorder = new MediaRecorder(audioStream)

    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    })

    mediaRecorder.addEventListener("stop", async () => {
      currentAudioBlob = new Blob(audioChunks, {
        type: "audio/webm"
      })

      const audioUrl = URL.createObjectURL(currentAudioBlob)

      if (audioPreview) {
        audioPreview.src = audioUrl
      }

      if (audioPreviewBox) {
        audioPreviewBox.hidden = false
      }

      stopAudioStream()
      setRecordingVisual(false)

      setStatus(
        "Gravação finalizada",
        "Ouça o áudio enquanto o Emodia gera a transcrição."
      )

      await transcribeAudioRecording()
    })

    mediaRecorder.start()
    startTimer()
    showRecordingButtons()
    setRecordingVisual(true)
    hideTranscriptionStatus()

    if (audioPreviewBox) {
      audioPreviewBox.hidden = true
    }

    setStatus(
      "Gravando agora...",
      "Fale naturalmente. Clique em parar quando terminar."
    )
  } catch {
    showOnlyStartButton()
    stopTimer()
    stopAudioStream()
    setRecordingVisual(false)

    setStatus(
      "Microfone bloqueado",
      "Não foi possível acessar o microfone. Verifique as permissões do navegador."
    )
  }
}

const stopAudioRecording = () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    return
  }

  mediaRecorder.stop()
  stopTimer()
  showProcessingButtons()
  setRecordingVisual(false)
}

const clearAudioRecording = () => {
  audioChunks = []
  currentAudioBlob = null

  stopAudioStream()
  stopTimer()
  setRecordingVisual(false)

  if (audioPreview) {
    audioPreview.removeAttribute("src")
    audioPreview.load()
  }

  if (audioPreviewBox) {
    audioPreviewBox.hidden = true
  }

  if (audioTranscript) {
    audioTranscript.value = ""
    audioTranscript.placeholder =
      "A transcrição automática aparecerá aqui. Você poderá editar antes de enviar."
  }

  if (audioTimer) {
    audioTimer.textContent = "00:00"
  }

  hideTranscriptionStatus()
  hideAudioForm()
  showOnlyStartButton()

  setStatus(
    "Pronto para gravar",
    "Clique em iniciar, fale seu relato e finalize quando terminar."
  )
}

if (startAudioButton && stopAudioButton && clearAudioButton && audioPreview) {
  hideAudioForm()
  showOnlyStartButton()

  startAudioButton.addEventListener("click", startAudioRecording)
  stopAudioButton.addEventListener("click", stopAudioRecording)
  clearAudioButton.addEventListener("click", clearAudioRecording)
}
