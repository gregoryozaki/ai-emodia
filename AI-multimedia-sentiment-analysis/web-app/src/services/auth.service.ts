import bcrypt from "bcrypt"

import { createUser, findUserByEmail } from "../repositories/user.repository.js"

type RegisterUserInput = {
  fullName: string
  birthDate: string
  email: string
  password: string
  confirmPassword: string
  consentTerm?: string
}

type LoginUserInput = {
  email: string
  password: string
}

const PASSWORD_REGEX = {
  minLength: /.{8,}/,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[@#$%&*!?._-]/
}

const isAdult = (birthDate: Date) => {
  const currentDate = new Date()

  let age = currentDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = currentDate.getMonth() - birthDate.getMonth()

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())
  ) {
    age -= 1
  }

  return age >= 18
}

const validatePassword = (password: string) => {
  return Object.values(PASSWORD_REGEX).every((regex) => {
    return regex.test(password)
  })
}

const registerUser = async (input: RegisterUserInput) => {
  const fullName = input.fullName.trim()
  const email = input.email.trim().toLowerCase()
  const birthDate = new Date(input.birthDate)

  if (!fullName) {
    throw new Error("Informe seu nome completo.")
  }

  if (!email) {
    throw new Error("Informe seu e-mail.")
  }

  if (Number.isNaN(birthDate.getTime())) {
    throw new Error("Informe uma data de nascimento válida.")
  }

  if (!isAdult(birthDate)) {
    throw new Error("Você precisa ter 18 anos ou mais para usar o Emodia.")
  }

  if (input.password !== input.confirmPassword) {
    throw new Error("As senhas não coincidem.")
  }

  if (!validatePassword(input.password)) {
    throw new Error("A senha não atende aos requisitos mínimos.")
  }

  if (input.consentTerm !== "true") {
    throw new Error("Você precisa aceitar os termos de uso e privacidade.")
  }

  const existingUser = await findUserByEmail(email)

  if (existingUser) {
    throw new Error("Já existe uma conta cadastrada com este e-mail.")
  }

  const passwordHash = await bcrypt.hash(input.password, 12)

  await createUser({
    fullName,
    birthDate,
    email,
    passwordHash,
    consentTerm: true
  })
}

const loginUser = async (input: LoginUserInput) => {
  const email = input.email.trim().toLowerCase()

  if (!email || !input.password) {
    throw new Error("Informe e-mail e senha.")
  }

  const user = await findUserByEmail(email)

  if (!user) {
    throw new Error("E-mail ou senha inválidos.")
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash
  )

  if (!passwordMatches) {
    throw new Error("E-mail ou senha inválidos.")
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email
  }
}

export { registerUser, loginUser }
