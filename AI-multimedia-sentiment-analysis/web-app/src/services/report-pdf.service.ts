import PDFDocument from "pdfkit"

type ReportRecord = {
  emotionLabel: string
  inputMode: string
  content: string | null
  intensity: number | null
  trigger: string | null
  createdAt: string
}

type ReportData = {
  title: string
  period: string
  previousPeriod: string
  total: number
  previousTotal: number
  totalVariation: number
  averageIntensity: number
  previousAverageIntensity: number
  intensityVariation: number
  mostFrequentEmotion: string
  emotionDistribution: Array<{
    label: string
    count: number
    percentage: number
  }>
  triggerDistribution: Array<{
    trigger: string
    count: number
    percentage: number
  }>
  riskAnalysis: {
    hasRisk: boolean
    hasCriticalRisk: boolean
    hasHighRisk: boolean
    alertMessage: string
    signals: Array<{
      category: string
      severity: string
      occurrences: number
      terms: string[]
    }>
  }
  advice: {
    title: string
    message: string
    alertLevel: string
  }
  records: ReportRecord[]
}

const addSectionTitle = (doc: PDFKit.PDFDocument, title: string) => {
  if (doc.y > 720) {
    doc.addPage()
  }

  doc.moveDown(1)
  doc.fontSize(15).fillColor("#111827").text(title)
  doc.moveDown(0.4)
}

const addTextBlock = (doc: PDFKit.PDFDocument, text: string) => {
  doc.fontSize(10.5).fillColor("#374151").text(text, {
    align: "left",
    lineGap: 3
  })
}

const addMetric = (
  doc: PDFKit.PDFDocument,
  label: string,
  value: string | number
) => {
  if (doc.y > 720) {
    doc.addPage()
  }

  doc.fontSize(10).fillColor("#6b7280").text(label)
  doc.fontSize(14).fillColor("#111827").text(String(value))
  doc.moveDown(0.35)
}

const formatVariation = (value: number) => {
  return value > 0 ? `+${value}` : String(value)
}

const generateEmotionReportPdf = (report: ReportData) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: {
      Title: `Emodia - ${report.title}`,
      Author: "Emodia"
    }
  })

  const chunks: Buffer[] = []

  doc.on("data", (chunk: Buffer) => {
    chunks.push(chunk)
  })

  const endPromise = new Promise<Buffer>((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks))
    })
  })

  doc.fontSize(24).fillColor("#111827").text("Emodia")
  doc.moveDown(0.2)

  doc.fontSize(16).fillColor("#374151").text(report.title)

  doc
    .fontSize(10)
    .fillColor("#6b7280")
    .text(`Período analisado: ${report.period}`)
    .text(`Período anterior para comparação: ${report.previousPeriod}`)

  doc.moveDown(1)

  addSectionTitle(doc, "Resumo do período")

  addMetric(doc, "Total de registros", report.total)
  addMetric(doc, "Total no período anterior", report.previousTotal)
  addMetric(
    doc,
    "Variação de registros",
    formatVariation(report.totalVariation)
  )
  addMetric(doc, "Emoção mais frequente", report.mostFrequentEmotion)
  addMetric(doc, "Intensidade média", `${report.averageIntensity}/10`)
  addMetric(
    doc,
    "Intensidade média no período anterior",
    `${report.previousAverageIntensity}/10`
  )
  addMetric(
    doc,
    "Variação de intensidade",
    formatVariation(report.intensityVariation)
  )

  addSectionTitle(doc, "Interpretação e recomendação")

  doc.fontSize(12).fillColor("#111827").text(report.advice.title)
  doc.moveDown(0.3)
  addTextBlock(doc, report.advice.message)

  addSectionTitle(doc, "Sinais de atenção e risco")

  addTextBlock(doc, report.riskAnalysis.alertMessage)

  if (report.riskAnalysis.signals.length > 0) {
    doc.moveDown(0.5)

    report.riskAnalysis.signals.forEach((signal) => {
      if (doc.y > 720) {
        doc.addPage()
      }

      doc.fontSize(10.5).fillColor("#111827").text(signal.category)

      doc
        .fontSize(9.5)
        .fillColor("#6b7280")
        .text(`Gravidade: ${signal.severity}`)
        .text(`Ocorrências: ${signal.occurrences}`)
        .text(`Termos encontrados: ${signal.terms.join(", ")}`)

      doc.moveDown(0.5)
    })
  } else {
    doc.moveDown(0.3)
    addTextBlock(doc, "Nenhum termo crítico foi identificado neste período.")
  }

  addSectionTitle(doc, "Distribuição emocional")

  if (report.emotionDistribution.length === 0) {
    addTextBlock(doc, "Nenhuma emoção registrada neste período.")
  } else {
    report.emotionDistribution.forEach((item) => {
      if (doc.y > 720) {
        doc.addPage()
      }

      doc
        .fontSize(10.5)
        .fillColor("#374151")
        .text(`${item.label}: ${item.count} registro(s) - ${item.percentage}%`)
    })
  }

  addSectionTitle(doc, "Gatilhos recorrentes")

  if (report.triggerDistribution.length === 0) {
    addTextBlock(doc, "Nenhum gatilho identificado neste período.")
  } else {
    report.triggerDistribution.forEach((item) => {
      if (doc.y > 720) {
        doc.addPage()
      }

      doc
        .fontSize(10.5)
        .fillColor("#374151")
        .text(
          `${item.trigger}: ${item.count} ocorrência(s) - ${item.percentage}%`
        )
    })
  }

  addSectionTitle(doc, "Registros do período")

  if (report.records.length === 0) {
    addTextBlock(doc, "Nenhum registro encontrado neste período.")
  } else {
    report.records.forEach((record, index) => {
      if (doc.y > 680) {
        doc.addPage()
      }

      doc
        .fontSize(11)
        .fillColor("#111827")
        .text(`${index + 1}. ${record.createdAt} - ${record.emotionLabel}`)

      doc
        .fontSize(9.5)
        .fillColor("#6b7280")
        .text(`Entrada: ${record.inputMode}`)
        .text(`Intensidade: ${record.intensity ?? 0}/10`)
        .text(`Gatilhos: ${record.trigger || "Não identificado"}`)

      doc.moveDown(0.25)

      doc
        .fontSize(10)
        .fillColor("#374151")
        .text(record.content || "Sem conteúdo textual registrado.", {
          lineGap: 3
        })

      doc.moveDown(0.8)
    })
  }

  addSectionTitle(doc, "Aviso importante")

  doc
    .fontSize(8.8)
    .fillColor("#6b7280")
    .text(
      "Este relatório é uma ferramenta de apoio ao autoconhecimento e não substitui avaliação médica, psicológica ou psiquiátrica. A detecção de termos sensíveis serve apenas como sinal de atenção e não confirma diagnóstico ou situação de risco. Em caso de sofrimento intenso, pensamentos de autoagressão, violência, ameaça ou risco imediato, procure ajuda presencial, uma pessoa de confiança ou serviço de emergência. No Brasil, o CVV atende pelo 188, o SAMU pelo 192 e a Polícia Militar pelo 190 em caso de ameaça ou violência."
    )

  doc.end()

  return endPromise
}

export { generateEmotionReportPdf }
