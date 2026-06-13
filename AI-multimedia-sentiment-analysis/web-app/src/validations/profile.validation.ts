import { z } from "zod"

import {
  FULL_NAME_MAX_LENGTH,
  FULL_NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  emailSchema,
  isAdult,
  parseBirthDate,
  passwordConfirmationSchema,
  passwordSchema
} from "./auth.validation.js"

const normalizeRequiredString = (value: unknown) => {
  return typeof value === "string" ? value : ""
}

const fullNameSchema = z.preprocess(
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
)

const birthDateSchema = z
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
  })

const currentPasswordSchema = z.preprocess(
  normalizeRequiredString,
  z
    .string()
    .min(1, "Informe sua senha atual.")
    .max(
      PASSWORD_MAX_LENGTH,
      `A senha atual deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`
    )
)

const updatePersonalDataSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  birthDate: birthDateSchema
})

const updatePasswordSchema = z
  .object({
    currentPassword: currentPasswordSchema,
    newPassword: passwordSchema,
    confirmNewPassword: passwordConfirmationSchema
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "A nova senha e a confirmação não coincidem.",
    path: ["confirmNewPassword"]
  })

const deleteAccountSchema = z.object({
  confirmation: z.literal("EXCLUIR", {
    error: "Para excluir a conta, digite EXCLUIR no campo de confirmação."
  })
})

const getProfileValidationMessage = (error: z.ZodError) => {
  return error.issues[0]?.message ?? "Os dados enviados são inválidos."
}

export {
  deleteAccountSchema,
  getProfileValidationMessage,
  updatePasswordSchema,
  updatePersonalDataSchema
}
