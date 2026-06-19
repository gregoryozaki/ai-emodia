import prisma from "../database/prisma.js"

type CreatePasswordResetTokenData = {
  userId: string
  tokenHash: string
  expiresAt: Date
}

const createPasswordResetToken = async (data: CreatePasswordResetTokenData) => {
  return prisma.passwordResetToken.create({
    data
  })
}

const findValidPasswordResetToken = async (tokenHash: string) => {
  return prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true
    }
  })
}

const markPasswordResetTokenAsUsed = async (id: string) => {
  return prisma.passwordResetToken.update({
    where: {
      id
    },
    data: {
      usedAt: new Date()
    }
  })
}

const deleteOldPasswordResetTokensByUserId = async (userId: string) => {
  return prisma.passwordResetToken.deleteMany({
    where: {
      userId,
      usedAt: null
    }
  })
}

export {
  createPasswordResetToken,
  deleteOldPasswordResetTokensByUserId,
  findValidPasswordResetToken,
  markPasswordResetTokenAsUsed
}
