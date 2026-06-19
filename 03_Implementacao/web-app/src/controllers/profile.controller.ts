import type { Request, Response } from "express"

import {
  deleteUserAccount,
  getUserProfile,
  updateUserAvatar,
  updateUserPassword,
  updateUserPersonalData
} from "../services/user.service.js"

const renderProfileWithMessage = async (
  req: Request,
  res: Response,
  statusCode: number,
  messageType: "success" | "error",
  message: string
) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  const profile = await getUserProfile(userId)

  res.status(statusCode).render("app/profile", {
    title: "Emodia | Perfil",
    profile,
    usePasswordToggle: true,
    useAvatarPreview: true,
    [messageType]: message
  })
}

const updatePersonalDataController = async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  try {
    await updateUserPersonalData({
      userId,
      fullName: req.body.fullName,
      email: req.body.email,
      birthDate: req.body.birthDate
    })

    res.redirect("/perfil?updated=1")
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao atualizar dados pessoais."

    await renderProfileWithMessage(req, res, 400, "error", message)
  }
}

const updatePasswordController = async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  try {
    await updateUserPassword({
      userId,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
      confirmNewPassword: req.body.confirmNewPassword
    })

    res.redirect("/perfil?password=1")
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao alterar senha."

    await renderProfileWithMessage(req, res, 400, "error", message)
  }
}

const updateAvatarController = async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  if (!req.file) {
    await renderProfileWithMessage(
      req,
      res,
      400,
      "error",
      "Selecione uma imagem para enviar."
    )
    return
  }

  const avatarPath = `/uploads/avatars/${req.file.filename}`

  await updateUserAvatar(userId, avatarPath)

  res.redirect("/perfil?avatar=1")
}

const deleteProfileController = async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    res.redirect("/login")
    return
  }

  try {
    await deleteUserAccount(userId, req.body.confirmation)

    req.session.destroy(() => {
      res.clearCookie("emodia.sid")
      res.redirect("/")
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao excluir conta."

    await renderProfileWithMessage(req, res, 400, "error", message)
  }
}

export {
  deleteProfileController,
  updateAvatarController,
  updatePasswordController,
  updatePersonalDataController
}
