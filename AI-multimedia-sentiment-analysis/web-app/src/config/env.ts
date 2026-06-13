import dotenv from "dotenv"
import { bool, cleanEnv, num, port, str } from "envalid"

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
  SMTP_PORT: port({
    default: 587
  }),
  SMTP_USER: str(),
  SMTP_PASS: str(),
  SMTP_FROM: str(),

  APP_URL: str({
    default: "http://localhost:3000"
  }),

  /*
   * Ambiente Python
   */
  EMODIA_CONDA_ENV: str({
    default: "emodia-ml"
  }),

  /*
   * Transcrição
   */
  EMODIA_TRANSCRIPTION_MODE: str({
    choices: ["local", "remote", "disabled"],
    default: "local"
  }),

  EMODIA_WHISPER_MODEL: str({
    default: "small"
  }),

  EMODIA_WHISPER_DEVICE: str({
    choices: ["auto", "cuda", "cpu"],
    default: "cpu"
  }),

  EMODIA_TRANSCRIPTION_REMOTE_URL: str({
    default: ""
  }),

  /*
   * NLP — BERTimbau
   */
  EMODIA_NLP_ENABLED: bool({
    default: true
  }),

  EMODIA_NLP_DEVICE: str({
    choices: ["auto", "cuda", "cpu"],
    default: "auto"
  }),

  EMODIA_NLP_TIMEOUT_MS: num({
    default: 120000
  }),

  EMODIA_NLP_MODEL_PATH: str({
    default: "../ml/models/nlp/bertimbau"
  }),

  EMODIA_NLP_SCRIPT_PATH: str({
    default: "../ml/src/nlp/predict_text_emotion.py"
  }),

  EMODIA_NLP_MIN_CONFIDENCE: num({
    default: 0.5
  }),

  EMODIA_NLP_HIGH_CONFIDENCE: num({
    default: 0.75
  }),

  /*
   * Visão computacional
   */
  EMODIA_CV_ENABLED: bool({
    default: true
  }),

  EMODIA_CV_TIMEOUT_MS: num({
    default: 120000
  }),

  EMODIA_CV_MODEL_PATH: str({
    default: "../ml/models/cv"
  }),

  EMODIA_CV_SCRIPT_PATH: str({
    default: "../ml/src/cv/predict_video_emotion.py"
  })
})
