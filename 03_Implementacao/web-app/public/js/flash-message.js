document.addEventListener("DOMContentLoaded", () => {
  const alerts = document.querySelectorAll("[data-flash-message]")

  alerts.forEach((alert) => {
    setTimeout(() => {
      alert.classList.add("flash-message-hidden")
    }, 4500)

    setTimeout(() => {
      alert.remove()
    }, 5200)
  })
})
