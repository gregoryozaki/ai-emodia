import type { NextFunction, Request, Response } from "express"

import { findUserById } from "../repositories/user.repository.js"

const setViewLocals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.locals.isAuthenticated = Boolean(req.session.userId)
  res.locals.currentUser = null

  if (!req.session.userId) {
    next()
    return
  }

  try {
    const user = await findUserById(req.session.userId)

    if (user) {
      const [firstName] = user.fullName.trim().split(" ")

      res.locals.currentUser = {
        id: user.id,
        fullName: user.fullName,
        firstName: firstName ?? user.fullName,
        email: user.email,
        avatarPath: user.avatarPath
      }
    }
  } catch {
    res.locals.currentUser = null
  }

  next()
}

export { setViewLocals }
