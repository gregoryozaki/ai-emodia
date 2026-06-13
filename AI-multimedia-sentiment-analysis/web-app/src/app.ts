import express from "express"
import morgan from "morgan"
import session from "express-session"
import connectPgSimple from "connect-pg-simple"
import { engine } from "express-handlebars"

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

app.use((_req, res) => {
  res.status(404).render("error", {
    title: "Página não encontrada!",
    message: "A rota acessada não existe."
  })
})

export default app
