const isAdult = (dateValue) => {
  const birthDate = new Date(dateValue)
  const currentDate = new Date()

  let age = currentDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = currentDate.getMonth() - birthDate.getMonth()

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())
  ) {
    age -= 1
  }

  return age >= 18
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm")
  const birthDateInput = document.getElementById("birthDate")
  const passwordInput = document.getElementById("registerPassword")
  const confirmPasswordInput = document.getElementById("confirmPassword")
  const feedback = document.getElementById("registerFeedback")

  const openTermsButton = document.getElementById("openTerms")
  const termsModal = document.getElementById("termsModal")
  const closeTermsElements = document.querySelectorAll("[data-close-terms]")

  if (
    !(form instanceof HTMLFormElement) ||
    !(birthDateInput instanceof HTMLInputElement) ||
    !(passwordInput instanceof HTMLInputElement) ||
    !(confirmPasswordInput instanceof HTMLInputElement) ||
    !(feedback instanceof HTMLElement)
  ) {
    return
  }

  const rules = [
    {
      elementId: "ruleLength",
      regex: /.{8,}/
    },
    {
      elementId: "ruleUppercase",
      regex: /[A-Z]/
    },
    {
      elementId: "ruleLowercase",
      regex: /[a-z]/
    },
    {
      elementId: "ruleNumber",
      regex: /[0-9]/
    },
    {
      elementId: "ruleSpecial",
      regex: /[@#$%&*!?._-]/
    }
  ]

  const updatePasswordRules = () => {
    rules.forEach((rule) => {
      const item = document.getElementById(rule.elementId)

      if (!item) return

      item.classList.toggle("valid", rule.regex.test(passwordInput.value))
    })
  }

  const showFeedback = (message) => {
    feedback.textContent = message
    feedback.classList.remove("d-none")
  }

  const hideFeedback = () => {
    feedback.textContent = ""
    feedback.classList.add("d-none")
  }

  const openTermsModal = () => {
    if (!(termsModal instanceof HTMLElement)) return

    termsModal.classList.add("open")
    termsModal.setAttribute("aria-hidden", "false")
  }

  const closeTermsModal = () => {
    if (!(termsModal instanceof HTMLElement)) return

    termsModal.classList.remove("open")
    termsModal.setAttribute("aria-hidden", "true")
  }

  passwordInput.addEventListener("input", updatePasswordRules)

  if (openTermsButton) {
    openTermsButton.addEventListener("click", openTermsModal)
  }

  closeTermsElements.forEach((element) => {
    element.addEventListener("click", closeTermsModal)
  })

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeTermsModal()
    }
  })

  form.addEventListener("submit", (event) => {
    hideFeedback()

    if (!isAdult(birthDateInput.value)) {
      event.preventDefault()
      showFeedback("Você precisa ter 18 anos ou mais para usar o Emodia.")
      return
    }

    if (passwordInput.value !== confirmPasswordInput.value) {
      event.preventDefault()
      showFeedback("As senhas não coincidem.")
      return
    }

    const hasInvalidRule = rules.some((rule) => {
      return !rule.regex.test(passwordInput.value)
    })

    if (hasInvalidRule) {
      event.preventDefault()
      showFeedback("Sua senha não atende todos os requisitos.")
    }
  })
})
