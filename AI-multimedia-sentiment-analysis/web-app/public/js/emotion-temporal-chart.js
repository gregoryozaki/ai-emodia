;(() => {
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

  const createSvgElement = (tag, attributes = {}) => {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag)

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, String(value))
    })

    return element
  }

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
    if (chart) {
      chart.innerHTML = ""
    }

    if (chartLegend) {
      chartLegend.innerHTML = ""
    }
  }

  const filterPoints = (points) => {
    const selectedEmotion = emotionSelect?.value || "all"
    const selectedTrigger = triggerSelect?.value || "all"

    return points.filter((point) => {
      const emotionMatches =
        selectedEmotion === "all" || point.emotion === selectedEmotion

      const triggerMatches =
        selectedTrigger === "all" || point.triggers.includes(selectedTrigger)

      return emotionMatches && triggerMatches
    })
  }

  const buildSeries = (points) => {
    const mode = modeSelect?.value || "emotions"
    const seriesMap = new Map()

    points.forEach((point) => {
      if (mode === "emotions") {
        const key = point.emotion

        if (!seriesMap.has(key)) {
          seriesMap.set(key, [])
        }

        seriesMap.get(key).push(point)
        return
      }

      if (mode === "triggers") {
        const triggers =
          point.triggers.length > 0 ? point.triggers : ["Sem gatilho"]

        triggers.forEach((trigger) => {
          if (!seriesMap.has(trigger)) {
            seriesMap.set(trigger, [])
          }

          seriesMap.get(trigger).push(point)
        })

        return
      }

      const triggers =
        point.triggers.length > 0 ? point.triggers : ["Sem gatilho"]

      triggers.forEach((trigger) => {
        const key = `${point.emotion} / ${trigger}`

        if (!seriesMap.has(key)) {
          seriesMap.set(key, [])
        }

        seriesMap.get(key).push(point)
      })
    })

    return Array.from(seriesMap.entries()).map(([name, values], index) => ({
      name,
      values,
      color: chartColors[index % chartColors.length]
    }))
  }

  const drawGrid = ({ width, height, padding }) => {
    if (!chart) {
      return
    }

    const axisColor = "rgba(203, 213, 225, 0.20)"
    const textColor = "rgba(226, 232, 240, 0.72)"

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

      const label = createSvgElement("text", {
        x: padding.left - 12,
        y: y + 4,
        fill: textColor,
        "font-size": 11,
        "text-anchor": "end"
      })

      label.textContent = String(value)
      chart.appendChild(label)
    }

    const title = createSvgElement("text", {
      x: padding.left,
      y: 20,
      fill: textColor,
      "font-size": 12
    })

    title.textContent = "Intensidade emocional"
    chart.appendChild(title)
  }

  const createPositionMap = (points) => {
    const positionMap = new Map()

    points.forEach((point, position) => {
      positionMap.set(point.index, position)
    })

    return positionMap
  }

  const drawSeries = ({ series, points, width, height, padding }) => {
    if (!chart || points.length === 0) {
      return
    }

    const plotWidth = width - padding.left - padding.right

    const plotHeight = height - padding.top - padding.bottom

    const maximumPosition = Math.max(points.length - 1, 1)

    const positionMap = createPositionMap(points)

    series.forEach((serie) => {
      const linePoints = serie.values
        .map((point) => {
          const position = positionMap.get(point.index)

          if (position === undefined) {
            return null
          }

          const x = padding.left + (position / maximumPosition) * plotWidth

          const y =
            height - padding.bottom - (point.intensity / 10) * plotHeight

          return {
            x,
            y,
            point,
            position
          }
        })
        .filter(Boolean)
        .sort((first, second) => {
          return first.position - second.position
        })

      if (linePoints.length > 1) {
        const pathData = linePoints
          .map((item, index) => {
            if (index === 0) {
              return `M ${item.x} ${item.y}`
            }

            return `L ${item.x} ${item.y}`
          })
          .join(" ")

        chart.appendChild(
          createSvgElement("path", {
            d: pathData,
            fill: "none",
            stroke: serie.color,
            "stroke-width": 3,
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          })
        )
      }

      linePoints.forEach(({ x, y, point }) => {
        const pointGroup = createSvgElement("g", {
          class: "temporal-chart-dot-group"
        })

        pointGroup.appendChild(
          createSvgElement("circle", {
            cx: x,
            cy: y,
            r: 3.5,
            fill: serie.color,
            stroke: "none"
          })
        )

        const title = createSvgElement("title")

        title.textContent =
          `${serie.name}\n` +
          `${point.dateTimeLabel}\n` +
          `Intensidade: ${point.intensity}/10`

        pointGroup.appendChild(title)
        chart.appendChild(pointGroup)
      })
    })
  }

  const getUniqueDatePoints = (points) => {
    const uniquePoints = []
    const knownDates = new Set()

    points.forEach((point) => {
      const dateKey = point.dateLabel || point.date || String(point.index)

      if (knownDates.has(dateKey)) {
        return
      }

      knownDates.add(dateKey)
      uniquePoints.push(point)
    })

    return uniquePoints
  }

  const limitDatePoints = (points, maximumLabels = 6) => {
    if (points.length <= maximumLabels) {
      return points
    }

    const selectedPoints = []

    for (let index = 0; index < maximumLabels; index += 1) {
      const position = Math.round(
        (index * (points.length - 1)) / (maximumLabels - 1)
      )

      const point = points[position]

      if (point && !selectedPoints.includes(point)) {
        selectedPoints.push(point)
      }
    }

    return selectedPoints
  }

  const drawXAxisLabels = ({ points, width, height, padding }) => {
    if (!chart || points.length === 0) {
      return
    }

    const textColor = "rgba(226, 232, 240, 0.65)"

    const plotWidth = width - padding.left - padding.right

    const maximumPosition = Math.max(points.length - 1, 1)

    const uniqueDatePoints = getUniqueDatePoints(points)

    const visibleDatePoints = limitDatePoints(uniqueDatePoints)

    visibleDatePoints.forEach((point) => {
      const position = points.findIndex((candidate) => {
        return candidate.index === point.index
      })

      if (position < 0) {
        return
      }

      const x = padding.left + (position / maximumPosition) * plotWidth

      chart.appendChild(
        createSvgElement("line", {
          x1: x,
          y1: height - padding.bottom,
          x2: x,
          y2: height - padding.bottom + 5,
          stroke: textColor,
          "stroke-width": 1
        })
      )

      const label = createSvgElement("text", {
        x,
        y: height - 15,
        fill: textColor,
        "font-size": 11,
        "text-anchor": "middle"
      })

      label.textContent = point.dateLabel
      chart.appendChild(label)
    })
  }

  const drawLegend = (series) => {
    if (!chartLegend) {
      return
    }

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
      bottom: 58,
      left: 48
    }

    chart.setAttribute("viewBox", `0 0 ${width} ${height}`)

    chart.setAttribute("preserveAspectRatio", "none")

    drawGrid({
      width,
      height,
      padding
    })

    drawSeries({
      series,
      points: filteredPoints,
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

  if (
    chart &&
    chartData &&
    chartLegend &&
    chartEmpty &&
    modeSelect &&
    emotionSelect &&
    triggerSelect
  ) {
    modeSelect.addEventListener("change", renderChart)

    emotionSelect.addEventListener("change", renderChart)

    triggerSelect.addEventListener("change", renderChart)

    window.addEventListener("resize", renderChart)

    renderChart()
  }
})()
