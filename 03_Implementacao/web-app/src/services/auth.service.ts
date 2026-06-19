import bcrypt from "bcrypt"

import { createUser, findUserByEmail } from "../repositories/user.repository.js"
import {
  getAuthValidationMessage,
  loginUserSchema,
  registerUserSchema
} from "../validations/auth.validation.js"

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

const registerUser = async (input: RegisterUserInput) => {
  const validation = registerUserSchema.safeParse(input)

  if (!validation.success) {
    throw new Error(getAuthValidationMessage(validation.error))
  }

  const { fullName, birthDate, email, password } = validation.data

  const existingUser = await findUserByEmail(email)

  if (existingUser) {
    throw new Error("Já existe uma conta cadastrada com este e-mail.")
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await createUser({
    fullName,
    birthDate,
    email,
    passwordHash,
    consentTerm: true
  })

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email
  }
}

const loginUser = async (input: LoginUserInput) => {
  const validation = loginUserSchema.safeParse(input)

  if (!validation.success) {
    throw new Error(getAuthValidationMessage(validation.error))
  }

  const { email, password } = validation.data

  const user = await findUserByEmail(email)

  if (!user) {
    throw new Error("E-mail ou senha inválidos.")
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)

  if (!passwordMatches) {
    throw new Error("E-mail ou senha inválidos.")
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email
  }
}

export { loginUser, registerUser }
