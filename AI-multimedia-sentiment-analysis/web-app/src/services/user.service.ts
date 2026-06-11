import { findUserById } from "../repositories/user.repository.js"

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short"
  }).format(date)
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
    age: calculateAge(user.birthDate),
    consentTerm: user.consentTerm ? "Aceito" : "Não aceito",
    createdAt: formatDate(user.createdAt),
    updatedAt: formatDate(user.updatedAt)
  }
}

export { getUserProfile }
