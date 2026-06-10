import express from "express"
import morgan from "morgan"
import { engine } from "express-handlebars"

import routes from "./routes/index.routes.js"

const app = express()

app.engine("handlebars", engine({}))
app.set("view engine", "handlebars")
app.set("views", `${process.cwd()}/src/views`)

app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/img", express.static(`${process.cwd()}/public/img`))
app.use("/css", [
  express.static(`${process.cwd()}/public/css`),
  express.static(`${process.cwd()}/node_modules/bootstrap/dist/css`)
])
app.use("/js", [
  express.static(`${process.cwd()}/public/js`),
  express.static(`${process.cwd()}/node_modules/bootstrap/dist/js`)
])

app.use(routes)

app.use((req, res) => {
  res.status(404).render("error", {
    title: "Página não encontrada!",
    message: "A rota acessada não existe."
  })
})

export default app
