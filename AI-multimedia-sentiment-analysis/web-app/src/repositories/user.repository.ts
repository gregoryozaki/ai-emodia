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

const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      birthDate: true,
      consentTerm: true,
      createdAt: true,
      updatedAt: true
    }
  })
}

const createUser = async (data: CreateUserData) => {
  return prisma.user.create({
    data
  })
}

export { createUser, findUserByEmail, findUserById }
