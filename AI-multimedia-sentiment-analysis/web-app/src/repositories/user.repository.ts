import prisma from "../database/prisma.js"

type CreateUserData = {
  fullName: string
  birthDate: Date
  email: string
  passwordHash: string
  consentTerm: boolean
}

type UpdateUserProfileData = {
  fullName: string
  birthDate: Date
  email: string
  passwordHash?: string
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
      passwordHash: true,
      consentTerm: true,
      avatarPath: true,
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

const updateUserProfileById = async (
  id: string,
  data: UpdateUserProfileData
) => {
  return prisma.user.update({
    where: {
      id
    },
    data
  })
}

const updateUserAvatarById = async (id: string, avatarPath: string) => {
  return prisma.user.update({
    where: {
      id
    },
    data: {
      avatarPath
    }
  })
}

const deleteUserById = async (id: string) => {
  return prisma.user.delete({
    where: {
      id
    }
  })
}

export {
  createUser,
  deleteUserById,
  findUserByEmail,
  findUserById,
  updateUserAvatarById,
  updateUserProfileById
}
