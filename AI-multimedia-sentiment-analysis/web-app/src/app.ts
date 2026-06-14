import express from "express"
app.set("trust proxy", 1)
import multer from "multer"
import morgan from "morgan"
import session from "express-session"
import connectPgSimple from "connect-pg-simple"
import { engine } from "express-handlebars"
import type { ErrorRequestHandler } from "express"

import { setViewLocals } from "./middlewares/view-locals.middleware.js"
import { env } from "./config/env.js"
import routes from "./routes/index.routes.js"

const app = express()
const PgSession = connectPgSimple(session)

app.engine("handlebars", engine({}))
app.set("view engine", "handlebars")
app.set("views", `${process.cwd()}/src/views`)

app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  session({
    name: "emodia.sid",
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: new PgSession({
      conString: env.DATABASE_URL,
      createTableIfMissing: true
    }),

    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
)

app.use(setViewLocals)

app.use("/img", express.static(`${process.cwd()}/public/img`))
app.use("/uploads", express.static(`${process.cwd()}/public/uploads`))
app.use("/css", [
  express.static(`${process.cwd()}/public/css`),
  express.static(`${process.cwd()}/node_modules/bootstrap/dist/css`)
])
app.use("/js", [
  express.static(`${process.cwd()}/public/js`),
  express.static(`${process.cwd()}/node_modules/bootstrap/dist/js`)
])
app.use(
  "/font",
  express.static(`${process.cwd()}/node_modules/bootstrap-icons/font`)
)

app.use(routes)

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error)
    return
  }

  const isUploadRoute =
    req.path.startsWith("/analises/audio/") ||
    req.path.startsWith("/analises/video/")

  if (error instanceof multer.MulterError) {
    res.status(400).json({
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Arquivo muito grande. Envie uma mídia de até 25 MB."
          : "Não foi possível receber o arquivo enviado."
    })
    return
  }

  if (isUploadRoute) {
    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Erro ao processar o arquivo enviado."
    })
    return
  }

  next(error)
}

app.use(errorHandler)

app.use((_req, res) => {
  res.status(404).render("error", {
    title: "Página não encontrada!",
    message: "A rota acessada não existe."
  })
})

export default app
