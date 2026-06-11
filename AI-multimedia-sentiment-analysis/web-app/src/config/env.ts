import dotenv from "dotenv"
import { cleanEnv, port, str } from "envalid"

dotenv.config({ quiet: true })

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production", "test"],
    default: "development"
  }),
  PORT: port({
    default: 3000
  }),
  DATABASE_URL: str(),
  SESSION_SECRET: str(),

  SMTP_HOST: str(),
  SMTP_PORT: port(),
  SMTP_USER: str(),
  SMTP_PASS: str(),
  SMTP_FROM: str(),

  APP_URL: str({
    default: "http://localhost:3000"
  })
})
