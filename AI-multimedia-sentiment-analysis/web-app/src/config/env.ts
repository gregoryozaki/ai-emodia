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
  DATABASE_URL: str()
})
