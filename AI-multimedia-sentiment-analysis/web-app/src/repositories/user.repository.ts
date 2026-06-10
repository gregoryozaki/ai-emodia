import prisma from "../database/prisma.js"

type CreateUserData = {
  fullName: string
  birthDate: Date
  email: string
  passwordHash: string
  consentTerm: boolean
}

const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: {
      email
    }
  })
}

const createUser = async (data: CreateUserData) => {
  return prisma.user.create({
    data
  })
}

export { findUserByEmail, createUser }
