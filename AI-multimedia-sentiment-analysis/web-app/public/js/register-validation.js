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

  passwordInput.addEventListener("input", updatePasswordRules)

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
