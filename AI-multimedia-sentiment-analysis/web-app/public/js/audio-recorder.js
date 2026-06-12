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

let audioStream = null
let mediaRecorder = null
let audioChunks = []
let timerInterval = null
let recordingSeconds = 0
let recognition = null
let liveTranscript = ""

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition

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

  stopAudioButton.hidden = true
  stopAudioButton.disabled = true

  clearAudioButton.hidden = true
  clearAudioButton.disabled = true
}

const showRecordingButton = () => {
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

  stopAudioButton.hidden = true
  stopAudioButton.disabled = true

  clearAudioButton.hidden = false
  clearAudioButton.disabled = false
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

const setupSpeechRecognition = () => {
  if (!SpeechRecognition) {
    showTranscriptionStatus(
      "Transcrição automática indisponível neste navegador. Use Chrome/Chromium ou preencha manualmente."
    )

    return null
  }

  const speechRecognition = new SpeechRecognition()

  speechRecognition.lang = "pt-BR"
  speechRecognition.continuous = true
  speechRecognition.interimResults = true
  speechRecognition.maxAlternatives = 1

  speechRecognition.onstart = () => {
    showTranscriptionStatus(
      "Transcrição automática ativa enquanto você fala..."
    )
  }

  speechRecognition.onresult = (event) => {
    let interimTranscript = ""

    for (
      let index = event.resultIndex;
      index < event.results.length;
      index += 1
    ) {
      const result = event.results[index]
      const text = result[0]?.transcript ?? ""

      if (result.isFinal) {
        liveTranscript += `${text.trim()} `
      } else {
        interimTranscript += text
      }
    }

    if (audioTranscript) {
      audioTranscript.value = `${liveTranscript}${interimTranscript}`.trim()
    }
  }

  speechRecognition.onerror = (event) => {
    const errorMessages = {
      "not-allowed":
        "Permissão de microfone/transcrição negada. Verifique as permissões do navegador.",
      "no-speech":
        "Nenhuma fala detectada. Tente falar mais próximo do microfone.",
      network:
        "A transcrição automática falhou por conexão/serviço indisponível. Você pode preencher manualmente.",
      "audio-capture": "Não foi possível capturar o áudio do microfone."
    }

    showTranscriptionStatus(
      errorMessages[event.error] ??
        "Não foi possível gerar a transcrição automática. Você pode editar ou preencher manualmente."
    )
  }

  speechRecognition.onend = () => {
    if (audioTranscript && audioTranscript.value.trim()) {
      showTranscriptionStatus(
        "Transcrição finalizada. Revise o texto antes de enviar."
      )

      return
    }

    showTranscriptionStatus(
      "Nenhuma transcrição foi gerada. Você pode tentar gravar novamente ou preencher manualmente."
    )
  }

  return speechRecognition
}

const startSpeechRecognition = () => {
  recognition = setupSpeechRecognition()

  if (!recognition) {
    return
  }

  try {
    liveTranscript = audioTranscript?.value
      ? `${audioTranscript.value.trim()} `
      : ""

    recognition.start()
  } catch {
    showTranscriptionStatus(
      "A transcrição automática já estava ativa ou não pôde ser iniciada."
    )
  }
}

const stopSpeechRecognition = () => {
  if (!recognition) {
    return
  }

  try {
    recognition.stop()
  } catch {
    // não faz nada
  }

  recognition = null
}

const startAudioRecording = async () => {
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })

    audioChunks = []

    mediaRecorder = new MediaRecorder(audioStream)

    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    })

    mediaRecorder.addEventListener("stop", () => {
      const audioBlob = new Blob(audioChunks, {
        type: "audio/webm"
      })

      const audioUrl = URL.createObjectURL(audioBlob)

      if (audioPreview) {
        audioPreview.src = audioUrl
      }

      if (audioPreviewBox) {
        audioPreviewBox.hidden = false
      }

      stopAudioStream()
      showFinishedButtons()
      setRecordingVisual(false)

      setStatus(
        "Gravação finalizada",
        "Ouça o áudio, revise a transcrição e envie quando estiver tudo certo."
      )

      if (!audioTranscript?.value.trim()) {
        showTranscriptionStatus(
          "A transcrição automática não gerou texto. Você pode preencher manualmente ou gravar novamente."
        )
      }
    })

    mediaRecorder.start()
    startTimer()
    startSpeechRecognition()
    showRecordingButton()
    setRecordingVisual(true)

    if (audioPreviewBox) {
      audioPreviewBox.hidden = true
    }

    setStatus(
      "Gravando agora...",
      "Fale naturalmente. A transcrição automática será preenchida enquanto você fala."
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
  stopSpeechRecognition()
  stopTimer()

  showFinishedButtons()
  setRecordingVisual(false)
}

const clearAudioRecording = () => {
  audioChunks = []
  liveTranscript = ""

  stopSpeechRecognition()
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
  }

  if (audioTimer) {
    audioTimer.textContent = "00:00"
  }

  hideTranscriptionStatus()
  showOnlyStartButton()

  setStatus(
    "Pronto para gravar",
    "Clique em iniciar, fale seu relato e finalize quando terminar."
  )
}

if (startAudioButton && stopAudioButton && clearAudioButton && audioPreview) {
  showOnlyStartButton()

  startAudioButton.addEventListener("click", startAudioRecording)
  stopAudioButton.addEventListener("click", stopAudioRecording)
  clearAudioButton.addEventListener("click", clearAudioRecording)
}
