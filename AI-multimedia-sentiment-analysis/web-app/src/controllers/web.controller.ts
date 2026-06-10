import type { Request, Response } from "express"

const renderHomePage = (req: Request, res: Response) => {
  res.render("home", {
    title: "Emodia | Início",
    useEmotionGauge: true
  })
}

const renderAnalysisPage = (req: Request, res: Response) => {
  res.render("analyses", {
    title: "Emodia | Área de análises"
  })
}

const renderAboutPage = (req: Request, res: Response) => {
  res.render("about", {
    title: "Emodia | Sobre"
  })
}

export { renderHomePage, renderAnalysisPage, renderAboutPage }
