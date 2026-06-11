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
  sendPasswordChangedEmail,
  sendPasswordResetEmail
} from "./mail.service.js"

type ResetPasswordInput = {
  token: string
  newPassword: string
  confirmNewPassword: string
}

const PASSWORD_REGEX = {
  minLength: /.{8,}/,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[@#$%&*!?._-]/
}

const validatePassword = (password: string) => {
  return Object.values(PASSWORD_REGEX).every((regex) => {
    return regex.test(password)
  })
}

const createTokenHash = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex")
}

const requestPasswordRecovery = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) {
    throw new Error("Informe um e-mail válido.")
  }

  const user = await findUserByEmail(normalizedEmail)

  /*
    Segurança:
    Mesmo se o e-mail não existir, não revelamos isso para a tela.
    Assim evitamos enumeração de contas.
  */
  if (!user) {
    return
  }

  await deleteOldPasswordResetTokensByUserId(user.id)

  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = createTokenHash(token)

  const expiresAt = new Date(Date.now() + 1000 * 60 * 30)

  await createPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt
  })

  const resetUrl = `${env.APP_URL}/redefinir-senha/${token}`

  await sendPasswordResetEmail(user.email, resetUrl)
}

const resetPassword = async (input: ResetPasswordInput) => {
  if (!input.token) {
    throw new Error("Token de recuperação inválido.")
  }

  if (!input.newPassword || !input.confirmNewPassword) {
    throw new Error("Informe e confirme a nova senha.")
  }

  if (input.newPassword !== input.confirmNewPassword) {
    throw new Error("A nova senha e a confirmação não coincidem.")
  }

  if (!validatePassword(input.newPassword)) {
    throw new Error("A nova senha não atende aos requisitos mínimos.")
  }

  const tokenHash = createTokenHash(input.token)

  const passwordResetToken = await findValidPasswordResetToken(tokenHash)

  if (!passwordResetToken) {
    throw new Error("Link de recuperação inválido ou expirado.")
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12)

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
