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
  const clientId = requiredEnv('GMAIL_CLIENT_ID', process.env.GMAIL_CLIENT_ID)
  const clientSecret = requiredEnv('GMAIL_CLIENT_SECRET', process.env.GMAIL_CLIENT_SECRET)
  const refreshToken = requiredEnv('GMAIL_REFRESH_TOKEN', process.env.GMAIL_REFRESH_TOKEN)

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user,
      clientId,
      clientSecret,
      refreshToken,
    },
  })

  return {
    async sendMail(message) {
      await transporter.sendMail(message)
    },
  }
}