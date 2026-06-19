const parseBirthDate = (dateValue) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue)

  if (!match) {
    return undefined
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const birthDate = new Date(year, month - 1, day)

  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    return undefined
  }

  return birthDate
}

const isAdult = (birthDate) => {
  const currentDate = new Date()

  let age = currentDate.getFullYear() - birthDate.getFullYear()
  const monthDifference = currentDate.getMonth() - birthDate.getMonth()

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && currentDate.getDate() < birthDate.getDate())
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

  const passwordRules = [
    {
      elementId: "ruleLength",
      validate: (password) => {
        return password.length >= 8 && password.length <= 72
      }
    },
    {
      elementId: "ruleUppercase",
      validate: (password) => /[A-Z]/.test(password)
    },
    {
      elementId: "ruleLowercase",
      validate: (password) => /[a-z]/.test(password)
    },
    {
      elementId: "ruleNumber",
      validate: (password) => /[0-9]/.test(password)
    },
    {
      elementId: "ruleSpecial",
      validate: (password) => /[@#$%&*!?._-]/.test(password)
    }
  ]

  const updatePasswordRules = () => {
    passwordRules.forEach((rule) => {
      const item = document.getElementById(rule.elementId)

      if (!item) {
        return
      }

      item.classList.toggle("valid", rule.validate(passwordInput.value))
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
    if (!(termsModal instanceof HTMLElement)) {
      return
    }

    termsModal.classList.add("open")
    termsModal.setAttribute("aria-hidden", "false")
  }

  const closeTermsModal = () => {
    if (!(termsModal instanceof HTMLElement)) {
      return
    }

    termsModal.classList.remove("open")
    termsModal.setAttribute("aria-hidden", "true")
  }

  passwordInput.addEventListener("input", () => {
    hideFeedback()
    updatePasswordRules()
  })

  confirmPasswordInput.addEventListener("input", hideFeedback)
  birthDateInput.addEventListener("change", hideFeedback)

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

    const birthDate = parseBirthDate(birthDateInput.value)

    if (!birthDate) {
      event.preventDefault()
      showFeedback("Informe uma data de nascimento válida.")
      return
    }

    if (!isAdult(birthDate)) {
      event.preventDefault()
      showFeedback("Você precisa ter 18 anos ou mais para usar o Emodia.")
      return
    }

    if (passwordInput.value !== confirmPasswordInput.value) {
      event.preventDefault()
      showFeedback("As senhas não coincidem.")
      return
    }

    const hasInvalidPasswordRule = passwordRules.some((rule) => {
      return !rule.validate(passwordInput.value)
    })

    if (hasInvalidPasswordRule) {
      event.preventDefault()
      showFeedback("Sua senha não atende a todos os requisitos.")
    }
  })

  updatePasswordRules()
})
