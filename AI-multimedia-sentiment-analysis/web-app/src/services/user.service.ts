import bcrypt from "bcrypt"

import {
  deleteUserById,
  findUserByEmail,
  findUserById,
  updateUserAvatarById,
  updateUserProfileById
} from "../repositories/user.repository.js"
import {
  deleteAccountSchema,
  getProfileValidationMessage,
  updatePasswordSchema,
  updatePersonalDataSchema
} from "../validations/profile.validation.js"
import {
  sendPasswordChangedEmail,
  sendProfileUpdatedEmail
} from "./mail.service.js"

type UpdateUserPersonalDataInput = {
  userId: string
  fullName: string
  email: string
  birthDate: string
}

type UpdateUserPasswordInput = {
  userId: string
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    dateStyle: "short"
  }).format(date)
}

const formatDateInput = (date: Date) => {
  const [formattedDate] = date.toISOString().split("T")

  return formattedDate ?? ""
}

const calculateAge = (birthDate: Date) => {
  const currentDate = new Date()

  let age = currentDate.getFullYear() - birthDate.getFullYear()
  const monthDifference = currentDate.getMonth() - birthDate.getMonth()

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && currentDate.getDate() < birthDate.getDate())
  ) {
    age -= 1
  }

  return age
}

const getUserProfile = async (userId: string) => {
  const user = await findUserById(userId)

  if (!user) {
    throw new Error("Usuário não encontrado.")
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    birthDate: formatDate(user.birthDate),
    birthDateInput: formatDateInput(user.birthDate),
    age: calculateAge(user.birthDate),
    consentTerm: user.consentTerm ? "Aceito" : "Não aceito",
    avatarPath: user.avatarPath,
    createdAt: formatDate(user.createdAt),
    updatedAt: formatDate(user.updatedAt)
  }
}

const updateUserPersonalData = async (input: UpdateUserPersonalDataInput) => {
  const validation = updatePersonalDataSchema.safeParse({
    fullName: input.fullName,
    email: input.email,
    birthDate: input.birthDate
  })

  if (!validation.success) {
    throw new Error(getProfileValidationMessage(validation.error))
  }

  const { fullName, email, birthDate } = validation.data

  const user = await findUserById(input.userId)

  if (!user) {
    throw new Error("Usuário não encontrado.")
  }

  const emailOwner = await findUserByEmail(email)

  if (emailOwner && emailOwner.id !== input.userId) {
    throw new Error("Este e-mail já está sendo usado por outra conta.")
  }

  await updateUserProfileById(input.userId, {
    fullName,
    email,
    birthDate
  })

  try {
    await sendProfileUpdatedEmail(email)
  } catch (error) {
    console.error("Erro ao enviar e-mail de atualização de perfil:", error)
  }
}

const updateUserPassword = async (input: UpdateUserPasswordInput) => {
  const validation = updatePasswordSchema.safeParse({
    currentPassword: input.currentPassword,
    newPassword: input.newPassword,
    confirmNewPassword: input.confirmNewPassword
  })

  if (!validation.success) {
    throw new Error(getProfileValidationMessage(validation.error))
  }

  const { currentPassword, newPassword } = validation.data

  const user = await findUserById(input.userId)

  if (!user) {
    throw new Error("Usuário não encontrado.")
  }

  const currentPasswordMatches = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  )

  if (!currentPasswordMatches) {
    throw new Error("Senha atual incorreta.")
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)

  await updateUserProfileById(input.userId, {
    fullName: user.fullName,
    email: user.email,
    birthDate: user.birthDate,
    passwordHash
  })

  try {
    await sendPasswordChangedEmail(user.email)
  } catch (error) {
    console.error("Erro ao enviar e-mail de alteração de senha:", error)
  }
}

const updateUserAvatar = async (userId: string, avatarPath: string) => {
  await updateUserAvatarById(userId, avatarPath)
}

const deleteUserAccount = async (userId: string, confirmation: string) => {
  const validation = deleteAccountSchema.safeParse({
    confirmation
  })

  if (!validation.success) {
    throw new Error(getProfileValidationMessage(validation.error))
  }

  await deleteUserById(userId)
}

export {
  deleteUserAccount,
  getUserProfile,
  updateUserAvatar,
  updateUserPassword,
  updateUserPersonalData
}
