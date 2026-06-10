document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll("[data-toggle-password]")

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const inputId = button.getAttribute("data-toggle-password")

      if (!inputId) return

      const input = document.getElementById(inputId)

      if (!(input instanceof HTMLInputElement)) return

      const shouldShow = input.type === "password"

      input.type = shouldShow ? "text" : "password"
      button.textContent = shouldShow ? "🙈" : "👁"
    })
  })
})
