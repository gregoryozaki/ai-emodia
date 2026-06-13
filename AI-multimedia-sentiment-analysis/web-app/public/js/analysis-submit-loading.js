document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("[data-analysis-submit-form]")

  forms.forEach((form) => {
    if (!(form instanceof HTMLFormElement)) {
      return
    }

    form.addEventListener("submit", (event) => {
      if (!form.checkValidity()) {
        return
      }

      if (form.dataset.submitting === "true") {
        event.preventDefault()
        return
      }

      const submitButton = form.querySelector('button[type="submit"]')

      if (!(submitButton instanceof HTMLButtonElement)) {
        return
      }

      form.dataset.submitting = "true"
      form.setAttribute("aria-busy", "true")

      submitButton.disabled = true
      submitButton.innerHTML = `
        <span
          class="analysis-submit-spinner"
          aria-hidden="true"
        ></span>
        <span>Analisando...</span>
      `

      const status = document.createElement("div")

      status.className = "analysis-submit-progress"
      status.setAttribute("role", "status")
      status.setAttribute("aria-live", "polite")
      status.innerHTML = `
        <strong>
          ${
            form.dataset.analysisLoadingMessage ??
            "Processando sua análise emocional..."
          }
        </strong>

        <span>
          Isso pode levar alguns segundos. Não feche esta página.
        </span>
      `

      submitButton.before(status)
    })
  })
})
