const chart = document.getElementById("emotionTemporalChart")
const chartData = document.getElementById("temporalChartData")
const chartLegend = document.getElementById("temporalChartLegend")
const chartEmpty = document.getElementById("temporalChartEmpty")

const modeSelect = document.getElementById("temporalChartMode")
const emotionSelect = document.getElementById("temporalChartEmotion")
const triggerSelect = document.getElementById("temporalChartTrigger")

const chartColors = [
  "#22d3ee",
  "#ec4899",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#60a5fa",
  "#a78bfa"
]

const getPoints = () => {
  if (!chartData) {
    return []
  }

  return Array.from(chartData.querySelectorAll(".temporal-chart-point")).map(
    (item, index) => {
      const triggers = item.dataset.triggers
        ? item.dataset.triggers.split("|").filter(Boolean)
        : []

      return {
        index,
        date: item.dataset.date || "",
        dateLabel: item.dataset.dateLabel || "",
        dateTimeLabel: item.dataset.dateTimeLabel || "",
        emotion: item.dataset.emotion || "Sem emoção",
        intensity: Number(item.dataset.intensity || "0"),
        triggers
      }
    }
  )
}

const clearChart = () => {
  chart.innerHTML = ""
  chartLegend.innerHTML = ""
}

const createSvgElement = (tag, attributes = {}) => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag)

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, String(value))
  })

  return element
}

const filterPoints = (points) => {
  const selectedEmotion = emotionSelect.value
  const selectedTrigger = triggerSelect.value

  return points.filter((point) => {
    const emotionMatches =
      selectedEmotion === "all" || point.emotion === selectedEmotion

    const triggerMatches =
      selectedTrigger === "all" || point.triggers.includes(selectedTrigger)

    return emotionMatches && triggerMatches
  })
}

const buildSeries = (points) => {
  const mode = modeSelect.value
  const series = new Map()

  points.forEach((point) => {
    if (mode === "emotions") {
      const key = point.emotion

      if (!series.has(key)) {
        series.set(key, [])
      }

      series.get(key).push(point)
      return
    }

    if (mode === "triggers") {
      const triggers =
        point.triggers.length > 0 ? point.triggers : ["Sem gatilho"]

      triggers.forEach((trigger) => {
        if (!series.has(trigger)) {
          series.set(trigger, [])
        }

        series.get(trigger).push(point)
      })

      return
    }

    const triggers =
      point.triggers.length > 0 ? point.triggers : ["Sem gatilho"]

    triggers.forEach((trigger) => {
      const key = `${point.emotion} / ${trigger}`

      if (!series.has(key)) {
        series.set(key, [])
      }

      series.get(key).push(point)
    })
  })

  return Array.from(series.entries()).map(([name, values], index) => ({
    name,
    values,
    color: chartColors[index % chartColors.length]
  }))
}

const drawGrid = ({ width, height, padding }) => {
  const axisColor = "rgba(203, 213, 225, 0.22)"
  const textColor = "rgba(226, 232, 240, 0.7)"

  for (let value = 0; value <= 10; value += 2) {
    const y =
      height -
      padding.bottom -
      (value / 10) * (height - padding.top - padding.bottom)

    chart.appendChild(
      createSvgElement("line", {
        x1: padding.left,
        y1: y,
        x2: width - padding.right,
        y2: y,
        stroke: axisColor,
        "stroke-width": 1
      })
    )

    chart.appendChild(
      createSvgElement("text", {
        x: padding.left - 12,
        y: y + 4,
        fill: textColor,
        "font-size": 11,
        "text-anchor": "end"
      })
    ).textContent = value
  }

  chart.appendChild(
    createSvgElement("text", {
      x: padding.left,
      y: 20,
      fill: textColor,
      "font-size": 12
    })
  ).textContent = "Intensidade emocional"
}

const drawSeries = ({ series, allPoints, width, height, padding }) => {
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxIndex = Math.max(allPoints.length - 1, 1)

  series.forEach((serie) => {
    const pathPoints = serie.values.map((point) => {
      const x = padding.left + (point.index / maxIndex) * plotWidth
      const y = height - padding.bottom - (point.intensity / 10) * plotHeight

      return { x, y, point }
    })

    if (pathPoints.length > 1) {
      const path = pathPoints
        .map((item, index) => {
          if (index === 0) {
            return `M ${item.x} ${item.y}`
          }

          const previous = pathPoints[index - 1]
          const controlX = (previous.x + item.x) / 2

          return `C ${controlX} ${previous.y}, ${controlX} ${item.y}, ${item.x} ${item.y}`
        })
        .join(" ")

      chart.appendChild(
        createSvgElement("path", {
          d: path,
          fill: "none",
          stroke: serie.color,
          "stroke-width": 3.5,
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        })
      )
    }

    pathPoints.forEach(({ x, y, point }) => {
      const group = createSvgElement("g", {
        class: "temporal-chart-dot-group"
      })

      group.appendChild(
        createSvgElement("circle", {
          cx: x,
          cy: y,
          r: 5.8,
          fill: serie.color,
          stroke: "#ffffff",
          "stroke-width": 2
        })
      )

      const title = createSvgElement("title")
      title.textContent = `${serie.name}
${point.dateTimeLabel}
Intensidade: ${point.intensity}/10`

      group.appendChild(title)
      chart.appendChild(group)
    })
  })
}

const drawXAxisLabels = ({ points, width, height, padding }) => {
  const textColor = "rgba(226, 232, 240, 0.65)"
  const plotWidth = width - padding.left - padding.right
  const maxIndex = Math.max(points.length - 1, 1)

  const labels = points.filter((_, index) => {
    if (points.length <= 6) {
      return true
    }

    return index === 0 || index === points.length - 1 || index % 2 === 0
  })

  labels.forEach((point) => {
    const x = padding.left + (point.index / maxIndex) * plotWidth

    const text = createSvgElement("text", {
      x,
      y: height - 14,
      fill: textColor,
      "font-size": 11,
      "text-anchor": "middle"
    })

    text.textContent = point.dateLabel
    chart.appendChild(text)
  })
}

const drawLegend = (series) => {
  chartLegend.innerHTML = ""

  series.forEach((serie) => {
    const item = document.createElement("span")
    item.className = "temporal-chart-legend-item"

    const marker = document.createElement("i")
    marker.style.backgroundColor = serie.color

    const label = document.createElement("strong")
    label.textContent = serie.name

    item.appendChild(marker)
    item.appendChild(label)
    chartLegend.appendChild(item)
  })
}

const renderChart = () => {
  if (!chart || !chartData || !chartLegend || !chartEmpty) {
    return
  }

  const allPoints = getPoints()
  const filteredPoints = filterPoints(allPoints)
  const series = buildSeries(filteredPoints)

  clearChart()

  if (filteredPoints.length === 0 || series.length === 0) {
    chart.classList.add("d-none")
    chartLegend.classList.add("d-none")
    chartEmpty.classList.remove("d-none")
    return
  }

  chart.classList.remove("d-none")
  chartLegend.classList.remove("d-none")
  chartEmpty.classList.add("d-none")

  const width = chart.clientWidth || 900
  const height = 360
  const padding = {
    top: 42,
    right: 32,
    bottom: 48,
    left: 48
  }

  chart.setAttribute("viewBox", `0 0 ${width} ${height}`)
  chart.setAttribute("preserveAspectRatio", "none")

  drawGrid({ width, height, padding })
  drawSeries({
    series,
    allPoints,
    width,
    height,
    padding
  })
  drawXAxisLabels({
    points: filteredPoints,
    width,
    height,
    padding
  })
  drawLegend(series)
}

if (chart) {
  modeSelect.addEventListener("change", renderChart)
  emotionSelect.addEventListener("change", renderChart)
  triggerSelect.addEventListener("change", renderChart)
  window.addEventListener("resize", renderChart)

  renderChart()
}
