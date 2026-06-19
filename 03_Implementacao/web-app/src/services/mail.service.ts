import nodemailer from "nodemailer"

import { env } from "../config/env.js"

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
})

type SendMailInput = {
  to: string
  subject: string
  html: string
}

const sendMail = async (input: SendMailInput) => {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html
  })
}

const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  await sendMail({
    to: email,
    subject: "Redefinição de senha - Emodia",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Redefinição de senha</h2>

        <p>Recebemos uma solicitação para redefinir sua senha no Emodia.</p>

        <p>
          Clique no link abaixo para criar uma nova senha:
        </p>

        <p>
          <a href="${resetUrl}" target="_blank">
            Redefinir senha
          </a>
        </p>

        <p>Este link expira em 30 minutos.</p>

        <p>
          Se você não solicitou essa alteração, ignore este e-mail.
        </p>
      </div>
    `
  })
}

const sendProfileUpdatedEmail = async (email: string) => {
  await sendMail({
    to: email,
    subject: "Seu perfil foi atualizado - Emodia",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Perfil atualizado</h2>

        <p>Seus dados de perfil foram atualizados no Emodia.</p>

        <p>
          Se você não fez essa alteração, acesse sua conta e altere sua senha imediatamente.
        </p>
      </div>
    `
  })
}

const sendPasswordChangedEmail = async (email: string) => {
  await sendMail({
    to: email,
    subject: "Sua senha foi alterada - Emodia",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Senha alterada</h2>

        <p>Sua senha do Emodia foi alterada com sucesso.</p>

        <p>
          Se você não fez essa alteração, solicite uma recuperação de senha imediatamente.
        </p>
      </div>
    `
  })
}

export {
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
  sendProfileUpdatedEmail
}
