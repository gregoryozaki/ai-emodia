;(() => {
  const startAudioButton = document.getElementById("startAudioRecording")
  const stopAudioButton = document.getElementById("stopAudioRecording")
  const cancelAudioButton = document.getElementById("cancelAudioRecording")

  const audioPreview = document.getElementById("audioRecordingPreview")
  const audioPreviewBox = document.getElementById("audioPreviewBox")
  const audioStatus = document.getElementById("audioRecorderStatus")
  const audioHelper = document.getElementById("audioRecorderHelper")
  const audioTimer = document.getElementById("audioRecorderTimer")
  const audioVisual = document.getElementById("audioRecorderVisual")
  const transcriptionStatus = document.getElementById(
    "audioTranscriptionStatus"
  )
  const audioTranscript = document.getElementById("audioTranscript")
  const audioAnalysisForm = document.getElementById("audioAnalysisForm")

  let audioStream = null
  let mediaRecorder = null
  let audioChunks = []
  let currentAudioBlob = null
  let timerInterval = null
  let recordingSeconds = 0
  let audioPreviewUrl = null
  let audioCancelled = false
  let transcriptionAbortController = null

  const formatTime = (seconds) => {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0")

    const remainingSeconds = String(seconds % 60).padStart(2, "0")

    return `${minutes}:${remainingSeconds}`
  }

  const isAudioAbortError = (error) => {
    return error instanceof Error && error.name === "AbortError"
  }

  const readJsonResponse = async (response) => {
    const contentType = response.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      return response.json()
    }

    await response.text().catch(() => "")

    if (!response.ok) {
      return {
        message:
          "O servidor retornou uma resposta inválida ao transcrever o áudio."
      }
    }

    throw new Error(
      "O servidor retornou uma resposta inválida ao transcrever o áudio."
    )
  }

  const setAudioStatus = (status, helper) => {
    if (audioStatus) {
      audioStatus.textContent = status
    }

    if (audioHelper) {
      audioHelper.textContent = helper
    }
  }

  const revokeAudioPreviewUrl = () => {
    if (!audioPreviewUrl) {
      return
    }

    URL.revokeObjectURL(audioPreviewUrl)
    audioPreviewUrl = null
  }

  const showInitialAudioButtons = () => {
    startAudioButton.hidden = false
    startAudioButton.disabled = false
    startAudioButton.textContent = "🎙️ Iniciar gravação"

    stopAudioButton.hidden = true
    stopAudioButton.disabled = true

    cancelAudioButton.hidden = true
    cancelAudioButton.disabled = true
  }

  const showAudioRecordingButtons = () => {
    startAudioButton.hidden = false
    startAudioButton.disabled = true

    stopAudioButton.hidden = false
    stopAudioButton.disabled = false

    cancelAudioButton.hidden = false
    cancelAudioButton.disabled = false
  }

  const showAudioProcessingButtons = () => {
    startAudioButton.hidden = false
    startAudioButton.disabled = true

    stopAudioButton.hidden = true
    stopAudioButton.disabled = true

    cancelAudioButton.hidden = false
    cancelAudioButton.disabled = false
  }

  const showAudioFinishedButtons = () => {
    startAudioButton.hidden = false
    startAudioButton.disabled = false
    startAudioButton.textContent = "🎙️ Gravar novamente"

    stopAudioButton.hidden = true
    stopAudioButton.disabled = true

    cancelAudioButton.hidden = false
    cancelAudioButton.disabled = false
  }

  const startAudioTimer = () => {
    recordingSeconds = 0

    if (audioTimer) {
      audioTimer.textContent = "00:00"
    }

    timerInterval = window.setInterval(() => {
      recordingSeconds += 1

      if (audioTimer) {
        audioTimer.textContent = formatTime(recordingSeconds)
      }
    }, 1000)
  }

  const stopAudioTimer = () => {
    if (timerInterval === null) {
      return
    }

    window.clearInterval(timerInterval)
    timerInterval = null
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

  const setAudioRecordingVisual = (isRecording) => {
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

  const resetAudioRecorder = () => {
    transcriptionAbortController?.abort()
    transcriptionAbortController = null

    audioChunks = []
    currentAudioBlob = null
    mediaRecorder = null

    stopAudioStream()
    stopAudioTimer()
    setAudioRecordingVisual(false)
    revokeAudioPreviewUrl()

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
    showInitialAudioButtons()

    setAudioStatus(
      "Pronto para gravar",
      "Clique em iniciar, fale seu relato e finalize quando terminar."
    )
  }

  const transcribeAudioRecording = async () => {
    if (!currentAudioBlob || audioCancelled) {
      return
    }

    transcriptionAbortController = new AbortController()

    showAudioProcessingButtons()
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
        body: formData,
        signal: transcriptionAbortController.signal
      })

      const data = await readJsonResponse(response)

      if (!response.ok) {
        throw new Error(data.message || "Erro ao transcrever áudio.")
      }

      if (audioCancelled) {
        return
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

      setAudioStatus(
        "Transcrição pronta",
        "Revise o texto gerado e clique em enviar."
      )
    } catch (error) {
      if (isAudioAbortError(error) || audioCancelled) {
        return
      }

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

      setAudioStatus(
        "Transcrição automática falhou",
        "Você ainda pode ouvir o áudio e preencher a transcrição manualmente."
      )
    } finally {
      transcriptionAbortController = null

      if (!audioCancelled) {
        showAudioFinishedButtons()
      }
    }
  }

  const startAudioRecording = async () => {
    try {
      audioCancelled = false

      transcriptionAbortController?.abort()
      transcriptionAbortController = null

      revokeAudioPreviewUrl()

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

      if (audioPreviewBox) {
        audioPreviewBox.hidden = true
      }

      hideAudioForm()
      hideTranscriptionStatus()

      mediaRecorder = new MediaRecorder(audioStream)

      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      })

      mediaRecorder.addEventListener("stop", async () => {
        stopAudioStream()
        stopAudioTimer()
        setAudioRecordingVisual(false)

        if (audioCancelled) {
          resetAudioRecorder()
          return
        }

        currentAudioBlob = new Blob(audioChunks, {
          type: "audio/webm"
        })

        audioPreviewUrl = URL.createObjectURL(currentAudioBlob)

        if (audioPreview) {
          audioPreview.src = audioPreviewUrl
        }

        if (audioPreviewBox) {
          audioPreviewBox.hidden = false
        }

        setAudioStatus(
          "Gravação finalizada",
          "Ouça o áudio enquanto o Emodia gera a transcrição."
        )

        await transcribeAudioRecording()
      })

      mediaRecorder.start()

      startAudioTimer()
      showAudioRecordingButtons()
      setAudioRecordingVisual(true)

      setAudioStatus(
        "Gravando agora...",
        "Clique em parar para gerar a transcrição ou cancelar para descartar."
      )
    } catch (error) {
      console.error("Erro ao acessar o microfone:", error)

      resetAudioRecorder()

      setAudioStatus(
        "Microfone bloqueado",
        "Não foi possível acessar o microfone. Verifique as permissões do navegador."
      )
    }
  }

  const stopAudioRecording = () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      return
    }

    audioCancelled = false
    mediaRecorder.stop()

    stopAudioTimer()
    showAudioProcessingButtons()
    setAudioRecordingVisual(false)
  }

  const cancelAudioRecording = () => {
    audioCancelled = true

    transcriptionAbortController?.abort()
    transcriptionAbortController = null

    stopAudioTimer()
    setAudioRecordingVisual(false)

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop()
      stopAudioStream()
      return
    }

    resetAudioRecorder()
  }

  if (
    startAudioButton &&
    stopAudioButton &&
    cancelAudioButton &&
    audioPreview
  ) {
    resetAudioRecorder()

    startAudioButton.addEventListener("click", startAudioRecording)

    stopAudioButton.addEventListener("click", stopAudioRecording)

    cancelAudioButton.addEventListener("click", cancelAudioRecording)
  }
})()
