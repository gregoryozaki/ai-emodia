document.addEventListener("DOMContentLoaded", () => {
  const arcsGroup = document.getElementById("emotion-arcs")
  const needle = document.getElementById("needle")

  if (!arcsGroup || !needle) return

  const emotions = [
    { name: "Alegria", emoji: "😊", color: "#facc15", angle: -75 },
    { name: "Surpresa", emoji: "😮", color: "#fb923c", angle: -45 },
    { name: "Medo", emoji: "😨", color: "#c084fc", angle: -15 },
    { name: "Nojo", emoji: "🤢", color: "#4ade80", angle: 15 },
    { name: "Raiva", emoji: "😡", color: "#ef4444", angle: 45 },
    { name: "Tristeza", emoji: "😢", color: "#60a5fa", angle: 75 }
  ]

  const centerX = 200
  const centerY = 200
  const innerRadius = 82
  const outerRadius = 164

  const polarToCartesian = (cx, cy, radius, angleDeg) => {
    const radians = (angleDeg - 90) * (Math.PI / 180)

    return {
      x: cx + radius * Math.cos(radians),
      y: cy + radius * Math.sin(radians)
    }
  }

  emotions.forEach((emotion, index) => {
    const startAngle = -90 + index * 30
    const endAngle = startAngle + 30

    const outerStart = polarToCartesian(
      centerX,
      centerY,
      outerRadius,
      startAngle
    )
    const outerEnd = polarToCartesian(centerX, centerY, outerRadius, endAngle)
    const innerEnd = polarToCartesian(centerX, centerY, innerRadius, endAngle)
    const innerStart = polarToCartesian(
      centerX,
      centerY,
      innerRadius,
      startAngle
    )

    const pathData = `
      M ${outerStart.x} ${outerStart.y}
      A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}
      L ${innerEnd.x} ${innerEnd.y}
      A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y}
      Z
    `

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g")

    const arc = document.createElementNS("http://www.w3.org/2000/svg", "path")
    arc.setAttribute("d", pathData)
    arc.setAttribute("fill", emotion.color)
    arc.setAttribute("stroke", "rgba(255,255,255,0.7)")
    arc.setAttribute("stroke-width", "2")
    arc.setAttribute("opacity", "0.92")

    const middleAngle = startAngle + 15
    const emojiPosition = polarToCartesian(centerX, centerY, 121, middleAngle)

    const emoji = document.createElementNS("http://www.w3.org/2000/svg", "text")
    emoji.textContent = emotion.emoji
    emoji.setAttribute("x", emojiPosition.x)
    emoji.setAttribute("y", emojiPosition.y)
    emoji.setAttribute("text-anchor", "middle")
    emoji.setAttribute("dominant-baseline", "middle")
    emoji.setAttribute("class", "gauge-emoji")
    emoji.setAttribute("data-emotion", emotion.name)

    group.appendChild(arc)
    group.appendChild(emoji)
    arcsGroup.appendChild(group)
  })

  let currentIndex = 0

  setInterval(() => {
    const currentEmotion = emotions[currentIndex]

    needle.style.transform = `rotate(${currentEmotion.angle}deg)`

    document.querySelectorAll(".gauge-emoji").forEach((emoji, index) => {
      emoji.classList.toggle("active", index === currentIndex)
    })

    currentIndex = (currentIndex + 1) % emotions.length
  }, 1800)
})
