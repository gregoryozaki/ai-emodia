;(() => {
  const openVideoCameraButton = document.getElementById("openVideoCamera")

  const startVideoButton = document.getElementById("startVideoRecording")

  const stopVideoButton = document.getElementById("stopVideoRecording")

  const cancelVideoButton = document.getElementById("cancelVideoRecording")

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

  const videoVisualAnalysisInput = document.getElementById(
    "videoVisualAnalysisInput"
  )

  let videoStream = null
  let videoRecorder = null
  let videoChunks = []
  let currentVideoBlob = null
  let videoTimerInterval = null
  let videoRecordingSeconds = 0
  let videoPreviewUrl = null
  let videoCancelled = false
  let videoAbortController = null

  const formatVideoTime = (seconds) => {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0")

    const remainingSeconds = String(seconds % 60).padStart(2, "0")

    return `${minutes}:${remainingSeconds}`
  }

  const isVideoAbortError = (error) => {
    return error instanceof Error && error.name === "AbortError"
  }

  const readResponse = async (response, fallbackMessage) => {
    const contentType = response.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      return response.json()
    }

    const responseText = await response.text().catch(() => "")

    return {
      message: responseText.trim() || fallbackMessage
    }
  }

  const setVideoStatus = (status, helper) => {
    if (videoStatus) {
      videoStatus.textContent = status
    }

    if (videoHelper) {
      videoHelper.textContent = helper
    }
  }

  const revokeVideoPreviewUrl = () => {
    if (!videoPreviewUrl) {
      return
    }

    URL.revokeObjectURL(videoPreviewUrl)
    videoPreviewUrl = null
  }

  const showInitialVideoButtons = () => {
    openVideoCameraButton.hidden = false
    openVideoCameraButton.disabled = false

    startVideoButton.hidden = true
    startVideoButton.disabled = true

    stopVideoButton.hidden = true
    stopVideoButton.disabled = true

    cancelVideoButton.hidden = true
    cancelVideoButton.disabled = true
  }

  const showCameraReadyButtons = () => {
    openVideoCameraButton.hidden = true
    openVideoCameraButton.disabled = true

    startVideoButton.hidden = false
    startVideoButton.disabled = false
    startVideoButton.textContent = "🔴 Iniciar gravação"

    stopVideoButton.hidden = true
    stopVideoButton.disabled = true

    cancelVideoButton.hidden = false
    cancelVideoButton.disabled = false
  }

  const showVideoRecordingButtons = () => {
    openVideoCameraButton.hidden = true
    openVideoCameraButton.disabled = true

    startVideoButton.hidden = false
    startVideoButton.disabled = true

    stopVideoButton.hidden = false
    stopVideoButton.disabled = false

    cancelVideoButton.hidden = false
    cancelVideoButton.disabled = false
  }

  const showVideoProcessingButtons = () => {
    openVideoCameraButton.hidden = true
    openVideoCameraButton.disabled = true

    startVideoButton.hidden = false
    startVideoButton.disabled = true

    stopVideoButton.hidden = true
    stopVideoButton.disabled = true

    cancelVideoButton.hidden = false
    cancelVideoButton.disabled = false
  }

  const showVideoFinishedButtons = () => {
    openVideoCameraButton.hidden = true
    openVideoCameraButton.disabled = true

    startVideoButton.hidden = false
    startVideoButton.disabled = false
    startVideoButton.textContent = "📹 Gravar novamente"

    stopVideoButton.hidden = true
    stopVideoButton.disabled = true

    cancelVideoButton.hidden = false
    cancelVideoButton.disabled = false
  }

  const startVideoTimer = () => {
    videoRecordingSeconds = 0

    if (videoTimer) {
      videoTimer.textContent = "00:00"
    }

    videoTimerInterval = window.setInterval(() => {
      videoRecordingSeconds += 1

      if (videoTimer) {
        videoTimer.textContent = formatVideoTime(videoRecordingSeconds)
      }
    }, 1000)
  }

  const stopVideoTimer = () => {
    if (videoTimerInterval === null) {
      return
    }

    window.clearInterval(videoTimerInterval)

    videoTimerInterval = null
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

  const resetVideoVisualAnalysis = () => {
    if (videoVisualAnalysisInput) {
      videoVisualAnalysisInput.value = ""
    }
  }

  const getSupportedVideoMimeType = () => {
    if (
      typeof MediaRecorder === "undefined" ||
      typeof MediaRecorder.isTypeSupported !== "function"
    ) {
      return ""
    }

    const mimeTypes = [
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9,opus",
      "video/webm"
    ]

    return (
      mimeTypes.find((mimeType) => {
        return MediaRecorder.isTypeSupported(mimeType)
      }) || ""
    )
  }

  const createVideoUploadBlob = () => {
    if (!currentVideoBlob) {
      return null
    }

    return new Blob([currentVideoBlob], {
      type: "video/webm"
    })
  }

  const resetVideoRecorder = () => {
    videoAbortController?.abort()
    videoAbortController = null

    videoChunks = []
    currentVideoBlob = null
    videoRecorder = null
    videoCancelled = false

    stopVideoStream()
    stopVideoTimer()
    setVideoRecordingVisual(false)
    resetVideoVisualAnalysis()
    revokeVideoPreviewUrl()

    if (videoLivePreview) {
      videoLivePreview.pause()
      videoLivePreview.srcObject = null
    }

    if (videoRecordingPreview) {
      videoRecordingPreview.pause()
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

  const openVideoCamera = async () => {
    try {
      videoCancelled = false

      stopVideoStream()

      videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: {
            ideal: 640,
            max: 1280
          },
          height: {
            ideal: 480,
            max: 720
          },
          frameRate: {
            ideal: 30,
            min: 15,
            max: 30
          }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      const videoTrack = videoStream.getVideoTracks()[0]

      if (videoTrack) {
        console.log("Configuração real da câmera:", videoTrack.getSettings())
      }

      if (videoLivePreview) {
        videoLivePreview.srcObject = videoStream

        videoLivePreview.muted = true
        videoLivePreview.playsInline = true

        await videoLivePreview.play()
      }

      if (videoLiveBox) {
        videoLiveBox.hidden = false
      }

      if (videoPreviewBox) {
        videoPreviewBox.hidden = true
      }

      resetVideoVisualAnalysis()
      hideVideoForm()
      hideVideoTranscriptionStatus()
      showCameraReadyButtons()

      setVideoStatus(
        "Câmera ligada",
        "Quando estiver pronto, clique em iniciar gravação."
      )
    } catch (error) {
      console.error("Erro ao abrir câmera:", error)

      resetVideoRecorder()

      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível acessar a câmera."

      setVideoStatus("Câmera ou microfone indisponível", message)
    }
  }

  const transcribeVideoAudio = async (signal) => {
    const uploadBlob = createVideoUploadBlob()

    if (!uploadBlob) {
      throw new Error("Nenhum vídeo disponível para transcrever.")
    }

    console.log("Enviando vídeo para transcrição:", {
      type: uploadBlob.type,
      size: uploadBlob.size
    })

    const formData = new FormData()

    formData.append("audio", uploadBlob, "emodia-video.webm")

    const response = await fetch("/analises/audio/transcrever", {
      method: "POST",
      body: formData,
      signal
    })

    const data = await readResponse(
      response,
      "O servidor retornou uma resposta inválida ao transcrever o vídeo."
    )

    if (!response.ok) {
      throw new Error(data.message || "Erro ao transcrever o áudio do vídeo.")
    }

    return data
  }

  const analyzeVideoVisualEmotion = async (signal) => {
    const uploadBlob = createVideoUploadBlob()

    if (!uploadBlob) {
      return null
    }

    console.log("Enviando vídeo para análise visual:", {
      type: uploadBlob.type,
      size: uploadBlob.size
    })

    const formData = new FormData()

    formData.append("video", uploadBlob, "emodia-video.webm")

    const response = await fetch("/analises/video/analisar-emocao", {
      method: "POST",
      body: formData,
      signal
    })

    const data = await readResponse(
      response,
      "O servidor retornou uma resposta inválida ao analisar o vídeo."
    )

    if (!response.ok) {
      throw new Error(
        data.message || "Não foi possível analisar a emoção facial."
      )
    }

    return data
  }

  const processVideoRecording = async () => {
    if (!currentVideoBlob || videoCancelled) {
      return
    }

    videoAbortController = new AbortController()

    const { signal } = videoAbortController

    showVideoProcessingButtons()
    showVideoForm()

    showVideoTranscriptionStatus("Transcrevendo o áudio do vídeo. Aguarde...")

    if (videoTranscript) {
      videoTranscript.value = ""
      videoTranscript.placeholder = "Transcrevendo áudio do vídeo..."
    }

    let transcriptionFinished = false

    try {
      try {
        const transcription = await transcribeVideoAudio(signal)

        if (videoCancelled) {
          return
        }

        if (videoTranscript) {
          videoTranscript.value = transcription.transcript || ""

          videoTranscript.placeholder =
            "A transcrição automática do vídeo aparecerá aqui. Você poderá editar antes de enviar."

          videoTranscript.focus()
        }

        transcriptionFinished = true

        showVideoTranscriptionStatus(
          "Transcrição pronta. Analisando expressão facial..."
        )

        setVideoStatus(
          "Transcrição pronta",
          "O sinal visual complementar está sendo analisado."
        )
      } catch (error) {
        if (isVideoAbortError(error) || videoCancelled) {
          throw error
        }

        const message =
          error instanceof Error ? error.message : "Erro ao gerar transcrição."

        console.error("Erro na transcrição do vídeo:", error)

        showVideoTranscriptionStatus(
          `${message} Tentando realizar a análise visual...`
        )

        if (videoTranscript) {
          videoTranscript.placeholder = "Digite a transcrição manualmente."

          videoTranscript.focus()
        }
      }

      if (videoCancelled) {
        return
      }

      try {
        const visualAnalysis = await analyzeVideoVisualEmotion(signal)

        if (videoVisualAnalysisInput && visualAnalysis) {
          videoVisualAnalysisInput.value = JSON.stringify(visualAnalysis)
        }

        if (visualAnalysis?.confidenceLevel === "LOW") {
          showVideoTranscriptionStatus(
            transcriptionFinished
              ? "Transcrição pronta. A análise visual foi concluída com baixa confiança. Revise antes de enviar."
              : "Análise visual concluída com baixa confiança. Preencha a transcrição antes de enviar."
          )

          setVideoStatus(
            "Análise visual concluída",
            "O sinal visual foi registrado como complementar e possui baixa confiança."
          )
        } else {
          showVideoTranscriptionStatus(
            transcriptionFinished
              ? "Transcrição e análise visual concluídas. Revise antes de enviar."
              : "Análise visual concluída. Preencha a transcrição antes de enviar."
          )

          setVideoStatus(
            "Processamento concluído",
            "Revise a transcrição e clique em enviar."
          )
        }
      } catch (error) {
        if (isVideoAbortError(error) || videoCancelled) {
          throw error
        }

        console.error("Erro na análise visual:", error)

        const message =
          error instanceof Error
            ? error.message
            : "A análise visual não ficou disponível."

        showVideoTranscriptionStatus(
          transcriptionFinished
            ? `Transcrição pronta. ${message}`
            : `Não foi possível gerar a transcrição nem a análise visual. ${message}`
        )

        setVideoStatus(
          transcriptionFinished
            ? "Transcrição pronta"
            : "Preenchimento manual necessário",
          "A análise pode continuar sem o sinal visual."
        )
      }
    } catch (error) {
      if (!isVideoAbortError(error) && !videoCancelled) {
        console.error("Erro ao processar vídeo:", error)
      }
    } finally {
      videoAbortController = null

      if (!videoCancelled) {
        showVideoFinishedButtons()
      }
    }
  }

  const startVideoRecording = async () => {
    if (!videoStream) {
      await openVideoCamera()
    }

    if (!videoStream) {
      return
    }

    videoCancelled = false
    videoChunks = []
    currentVideoBlob = null

    resetVideoVisualAnalysis()
    revokeVideoPreviewUrl()

    if (videoTranscript) {
      videoTranscript.value = ""
      videoTranscript.placeholder = "A transcrição automática aparecerá aqui."
    }

    hideVideoForm()
    hideVideoTranscriptionStatus()

    const mimeType = getSupportedVideoMimeType()

    const recorderOptions = mimeType
      ? {
          mimeType,
          videoBitsPerSecond: 1_500_000,
          audioBitsPerSecond: 96_000
        }
      : undefined

    try {
      videoRecorder = new MediaRecorder(videoStream, recorderOptions)
    } catch (error) {
      console.error("Erro ao criar o MediaRecorder:", error)

      setVideoStatus(
        "Gravação indisponível",
        "O navegador não conseguiu iniciar o gravador de vídeo."
      )

      return
    }

    videoRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        videoChunks.push(event.data)
      }
    })

    videoRecorder.addEventListener("stop", async () => {
      stopVideoTimer()
      stopVideoStream()
      setVideoRecordingVisual(false)

      if (videoCancelled) {
        resetVideoRecorder()
        return
      }

      if (videoChunks.length === 0) {
        resetVideoRecorder()

        setVideoStatus(
          "Falha na gravação",
          "Nenhum dado de vídeo foi capturado. Tente novamente."
        )

        return
      }

      currentVideoBlob = new Blob(videoChunks, {
        type: "video/webm"
      })

      console.log("Vídeo gravado:", {
        recorderMimeType: videoRecorder?.mimeType,
        blobType: currentVideoBlob.type,
        blobSize: currentVideoBlob.size
      })

      videoPreviewUrl = URL.createObjectURL(currentVideoBlob)

      if (videoRecordingPreview) {
        videoRecordingPreview.src = videoPreviewUrl

        videoRecordingPreview.playsInline = true
      }

      if (videoPreviewBox) {
        videoPreviewBox.hidden = false
      }

      if (videoLiveBox) {
        videoLiveBox.hidden = true
      }

      setVideoStatus(
        "Gravação finalizada",
        "O Emodia está processando o vídeo."
      )

      await processVideoRecording()
    })

    videoRecorder.addEventListener("error", (event) => {
      console.error("Erro durante gravação de vídeo:", event)

      resetVideoRecorder()

      setVideoStatus(
        "Erro na gravação",
        "Não foi possível concluir a gravação do vídeo."
      )
    })

    videoRecorder.start(1000)

    startVideoTimer()
    showVideoRecordingButtons()
    setVideoRecordingVisual(true)

    setVideoStatus(
      "Gravando vídeo agora...",
      "Clique em parar para analisar ou cancelar para descartar."
    )
  }

  const stopVideoRecording = () => {
    if (!videoRecorder || videoRecorder.state === "inactive") {
      return
    }

    videoCancelled = false
    videoRecorder.stop()

    stopVideoTimer()
    showVideoProcessingButtons()
    setVideoRecordingVisual(false)
  }

  const cancelVideoRecording = () => {
    videoCancelled = true

    videoAbortController?.abort()
    videoAbortController = null

    stopVideoTimer()
    setVideoRecordingVisual(false)

    if (videoRecorder && videoRecorder.state !== "inactive") {
      videoRecorder.stop()
      stopVideoStream()
      return
    }

    resetVideoRecorder()
  }

  if (
    openVideoCameraButton &&
    startVideoButton &&
    stopVideoButton &&
    cancelVideoButton &&
    videoLivePreview &&
    videoRecordingPreview
  ) {
    resetVideoRecorder()

    openVideoCameraButton.addEventListener("click", openVideoCamera)

    startVideoButton.addEventListener("click", startVideoRecording)

    stopVideoButton.addEventListener("click", stopVideoRecording)

    cancelVideoButton.addEventListener("click", cancelVideoRecording)

    window.addEventListener("beforeunload", () => {
      videoAbortController?.abort()
      stopVideoStream()
      revokeVideoPreviewUrl()
    })
  }
})()
