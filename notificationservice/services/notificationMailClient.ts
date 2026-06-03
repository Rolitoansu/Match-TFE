import nodemailer from 'nodemailer'

export type NotificationMailMessage = {
  from: string
  to: string
  subject: string
  text: string
  html: string
}

export interface NotificationMailClient {
  sendMail(message: NotificationMailMessage): Promise<void>
}

function requiredEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function resolveProvider() {
  return (process.env.NOTIFICATION_EMAIL_PROVIDER ?? 'gmail').toLowerCase()
}

export function resolveNotificationSenderEmail() {
  return process.env.GMAIL_FROM
    ?? process.env.SMTP_FROM
    ?? process.env.GMAIL_USER
    ?? process.env.SMTP_USER
    ?? 'no-reply@matchtfe.local'
}

export function createNotificationMailClient(): NotificationMailClient {
  const provider = resolveProvider()

  if (provider !== 'gmail') {
    throw new Error(`Unsupported NOTIFICATION_EMAIL_PROVIDER "${provider}". Only "gmail" is supported.`)
  }

  const user = requiredEnv('GMAIL_USER', process.env.GMAIL_USER ?? process.env.SMTP_USER)
  const appPassword = requiredEnv('GMAIL_APP_PASSWORD', process.env.GMAIL_APP_PASSWORD)

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass: appPassword,
    },
  })

  return {
    async sendMail(message) {
      await transporter.sendMail(message)
    },
  }
}