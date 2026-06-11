import bcrypt from "bcrypt"

import {
  deleteUserById,
  findUserByEmail,
  findUserById,
  updateUserAvatarById,
  updateUserProfileById
} from "../repositories/user.repository.js"
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

const PASSWORD_REGEX = {
  minLength: /.{8,}/,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[@#$%&*!?._-]/
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short"
  }).format(date)
}

const formatDateInput = (date: Date) => {
  return date.toISOString().split("T")[0]
}

const calculateAge = (birthDate: Date) => {
  const currentDate = new Date()

  let age = currentDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = currentDate.getMonth() - birthDate.getMonth()

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())
  ) {
    age -= 1
  }

  return age
}

const validateAdultBirthDate = (birthDate: Date) => {
  return calculateAge(birthDate) >= 18
}

const validatePassword = (password: string) => {
  return Object.values(PASSWORD_REGEX).every((regex) => {
    return regex.test(password)
  })
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
  const user = await findUserById(input.userId)

  if (!user) {
    throw new Error("Usuário não encontrado.")
  }

  const fullName = input.fullName.trim()
  const email = input.email.trim().toLowerCase()
  const birthDate = new Date(input.birthDate)

  if (!fullName || fullName.length < 3) {
    throw new Error("Informe um nome com pelo menos 3 caracteres.")
  }

  if (!email) {
    throw new Error("Informe um e-mail válido.")
  }

  if (Number.isNaN(birthDate.getTime())) {
    throw new Error("Informe uma data de nascimento válida.")
  }

  if (!validateAdultBirthDate(birthDate)) {
    throw new Error("Você precisa ter 18 anos ou mais para usar o Emodia.")
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
  const user = await findUserById(input.userId)

  if (!user) {
    throw new Error("Usuário não encontrado.")
  }

  if (!input.currentPassword) {
    throw new Error("Informe sua senha atual.")
  }

  if (!input.newPassword || !input.confirmNewPassword) {
    throw new Error("Informe e confirme a nova senha.")
  }

  const currentPasswordMatches = await bcrypt.compare(
    input.currentPassword,
    user.passwordHash
  )

  if (!currentPasswordMatches) {
    throw new Error("Senha atual incorreta.")
  }

  if (input.newPassword !== input.confirmNewPassword) {
    throw new Error("A nova senha e a confirmação não coincidem.")
  }

  if (!validatePassword(input.newPassword)) {
    throw new Error("A nova senha não atende aos requisitos mínimos.")
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12)

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
  if (confirmation !== "EXCLUIR") {
    throw new Error(
      "Para excluir a conta, digite EXCLUIR no campo de confirmação."
    )
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
