import type { NextFunction, Request, Response } from "express"

const ensureAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session.userId) {
    next()
    return
  }

  res.redirect("/login")
}

export { ensureAuthenticated }
