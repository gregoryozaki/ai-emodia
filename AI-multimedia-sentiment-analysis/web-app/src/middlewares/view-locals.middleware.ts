import type { NextFunction, Request, Response } from "express"

const setViewLocals = (req: Request, res: Response, next: NextFunction) => {
  res.locals.isAuthenticated = Boolean(req.session.userId)

  next()
}

export { setViewLocals }
