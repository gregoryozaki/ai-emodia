import type { Request, Response } from "express"

const healthCheck = (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "API funcionando"
  })
}

export { healthCheck }
