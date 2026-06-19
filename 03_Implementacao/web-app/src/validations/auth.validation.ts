import { z } from "zod"

const FULL_NAME_MIN_LENGTH = 3
const FULL_NAME_MAX_LENGTH = 120
const EMAIL_MAX_LENGTH = 254
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 72

const normalizeRequiredString = (value: unknown) => {
  return typeof value === "string" ? value : ""
}

const passwordSchema = z.preprocess(
  normalizeRequiredString,
  z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
    )
    .max(
      PASSWORD_MAX_LENGTH,
      `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`
    )
    .regex(/[A-Z]/, "A senha deve conter uma letra maiúscula.")
    .regex(/[a-z]/, "A senha deve conter uma letra minúscula.")
    .regex(/[0-9]/, "A senha deve conter um número.")
    .regex(
      /[@#$%&*!?._-]/,
      "A senha deve conter um caractere especial permitido."
    )
)

const passwordConfirmationSchema = z.preprocess(
  normalizeRequiredString,
  z
    .string()
    .min(1, "Confirme sua senha.")
    .max(
      PASSWORD_MAX_LENGTH,
      `A confirmação deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`
    )
)

const loginPasswordSchema = z.preprocess(
  normalizeRequiredString,
  z
    .string()
    .min(1, "Informe sua senha.")
    .max(
      PASSWORD_MAX_LENGTH,
      `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`
    )
)

const emailSchema = z.preprocess(
  (value) => {
    return typeof value === "string" ? value.trim().toLowerCase() : ""
  },
  z
    .string()
    .min(1, "Informe seu e-mail.")
    .max(
      EMAIL_MAX_LENGTH,
      `O e-mail deve ter no máximo ${EMAIL_MAX_LENGTH} caracteres.`
    )
    .email("Informe um e-mail válido.")
)

const parseBirthDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return undefined
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined
  }

  return date
}

const isAdult = (birthDate: Date) => {
  const currentDate = new Date()

  let age = currentDate.getFullYear() - birthDate.getFullYear()
  const monthDifference = currentDate.getMonth() - birthDate.getMonth()

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && currentDate.getDate() < birthDate.getDate())
  ) {
    age -= 1
  }

  return age >= 18
}

const passwordResetTokenSchema = z.preprocess(
  (value) => {
    return typeof value === "string" ? value.trim() : ""
  },
  z.string().regex(/^[a-f0-9]{64}$/i, "Token de recuperação inválido.")
)

const registerUserSchema = z
  .object({
    fullName: z.preprocess(
      (value) => {
        return typeof value === "string" ? value.trim() : ""
      },
      z
        .string()
        .min(
          FULL_NAME_MIN_LENGTH,
          `O nome deve ter pelo menos ${FULL_NAME_MIN_LENGTH} caracteres.`
        )
        .max(
          FULL_NAME_MAX_LENGTH,
          `O nome deve ter no máximo ${FULL_NAME_MAX_LENGTH} caracteres.`
        )
    ),

    birthDate: z
      .preprocess(normalizeRequiredString, z.string())
      .refine((value) => value.length > 0, {
        message: "Informe sua data de nascimento."
      })
      .transform((value, context) => {
        const birthDate = parseBirthDate(value)

        if (!birthDate) {
          context.addIssue({
            code: "custom",
            message: "Informe uma data de nascimento válida."
          })

          return z.NEVER
        }

        if (!isAdult(birthDate)) {
          context.addIssue({
            code: "custom",
            message: "Você precisa ter 18 anos ou mais para usar o Emodia."
          })

          return z.NEVER
        }

        return birthDate
      }),

    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordConfirmationSchema,

    consentTerm: z.literal("true", {
      error: "Você precisa aceitar os termos de uso e privacidade."
    })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"]
  })

const loginUserSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema
})

const requestPasswordRecoverySchema = z.object({
  email: emailSchema
})

const passwordResetTokenParamsSchema = z.object({
  token: passwordResetTokenSchema
})

const resetPasswordSchema = z
  .object({
    token: passwordResetTokenSchema,
    newPassword: passwordSchema,
    confirmNewPassword: passwordConfirmationSchema
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "A nova senha e a confirmação não coincidem.",
    path: ["confirmNewPassword"]
  })

const getAuthValidationMessage = (error: z.ZodError) => {
  return error.issues[0]?.message ?? "Os dados enviados são inválidos."
}

export {
  EMAIL_MAX_LENGTH,
  FULL_NAME_MAX_LENGTH,
  FULL_NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  emailSchema,
  getAuthValidationMessage,
  isAdult,
  loginUserSchema,
  parseBirthDate,
  passwordConfirmationSchema,
  passwordResetTokenParamsSchema,
  passwordSchema,
  registerUserSchema,
  requestPasswordRecoverySchema,
  resetPasswordSchema
}
