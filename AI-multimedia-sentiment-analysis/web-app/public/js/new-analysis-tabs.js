const inputTabs = document.querySelectorAll("[data-input-tab]")
const inputPanels = document.querySelectorAll("[data-input-panel]")

inputTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const selectedTab = tab.dataset.inputTab

    inputTabs.forEach((item) => {
      item.classList.toggle("active", item === tab)
    })

    inputPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.inputPanel === selectedTab)
    })
  })
})
