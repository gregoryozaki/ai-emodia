import bcrypt from "bcrypt"
import crypto from "node:crypto"

import { env } from "../config/env.js"
import {
  createPasswordResetToken,
  deleteOldPasswordResetTokensByUserId,
  findValidPasswordResetToken,
  markPasswordResetTokenAsUsed
} from "../repositories/password-reset-token.repository.js"
import {
  findUserByEmail,
  updateUserProfileById
} from "../repositories/user.repository.js"
import {
  getAuthValidationMessage,
  requestPasswordRecoverySchema,
  resetPasswordSchema
} from "../validations/auth.validation.js"
import {
  sendPasswordChangedEmail,
  sendPasswordResetEmail
} from "./mail.service.js"

type ResetPasswordInput = {
  token: string
  newPassword: string
  confirmNewPassword: string
}

const createTokenHash = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex")
}

const requestPasswordRecovery = async (email: unknown) => {
  const validation = requestPasswordRecoverySchema.safeParse({ email })

  if (!validation.success) {
    throw new Error(getAuthValidationMessage(validation.error))
  }

  const normalizedEmail = validation.data.email
  const user = await findUserByEmail(normalizedEmail)

  /*
    Não informamos se o e-mail existe para evitar
    enumeração de contas cadastradas.
  */
  if (!user) {
    return
  }

  await deleteOldPasswordResetTokensByUserId(user.id)

  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = createTokenHash(token)
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  await createPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt
  })

  const resetUrl = `${env.APP_URL}/redefinir-senha/${token}`

  await sendPasswordResetEmail(user.email, resetUrl)
}

const resetPassword = async (input: ResetPasswordInput) => {
  const validation = resetPasswordSchema.safeParse(input)

  if (!validation.success) {
    throw new Error(getAuthValidationMessage(validation.error))
  }

  const { token, newPassword } = validation.data
  const tokenHash = createTokenHash(token)

  const passwordResetToken = await findValidPasswordResetToken(tokenHash)

  if (!passwordResetToken) {
    throw new Error("Link de recuperação inválido ou expirado.")
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)

  await updateUserProfileById(passwordResetToken.userId, {
    fullName: passwordResetToken.user.fullName,
    email: passwordResetToken.user.email,
    birthDate: passwordResetToken.user.birthDate,
    passwordHash
  })

  await markPasswordResetTokenAsUsed(passwordResetToken.id)

  try {
    await sendPasswordChangedEmail(passwordResetToken.user.email)
  } catch (error) {
    console.error("Erro ao enviar e-mail de senha alterada:", error)
  }
}

export { requestPasswordRecovery, resetPassword }
