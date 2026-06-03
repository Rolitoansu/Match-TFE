import { NotificationRepository } from '../repositories/notificationRepository'
import { createNotificationMailClient, resolveNotificationSenderEmail, type NotificationMailClient } from './notificationMailClient'

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: Record<string, unknown>
  ) {
    super(String(payload.error ?? payload.message ?? 'Request failed'))
  }
}

type SendStudentsEmailInput = {
  requesterEmail: string
  subject: string
  message: string
  studentIds?: number[]
  studentEmails?: string[]
}

type CreateUserNotificationInput = {
  userId: number
  type: string
  content: string
}

type SendUserEmailInput = {
  userId: number
  type: string
  subject: string
  content: string
}

type UnreadNotificationRow = {
  userId: number
  type: string
  content: string
  timestamp: Date | null
}

type NotificationFrequency = 'disabled' | 'daily' | 'weekly' | 'biweekly' | 'monthly'

const REMINDER_INTERVAL_DAYS: Record<NotificationFrequency, number> = {
  disabled: Number.POSITIVE_INFINITY,
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function multilineToHtml(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim().length > 0
      ? `<p style="margin:0 0 12px;line-height:1.6;color:#334155;">${escapeHtml(line)}</p>`
      : '<div style="height:12px"></div>')
    .join('')
}

function buildEmailShell(input: { title: string; intro: string; bodyHtml: string; footer: string }) {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#eef2ff;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:720px;margin:0 auto;padding:32px 16px;">
      <div style="border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,.12);background:#ffffff;">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);color:#fff;">
          <div style="font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;opacity:.85;">Match-TFE</div>
          <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;">${escapeHtml(input.title)}</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#334155;">${escapeHtml(input.intro)}</p>
          ${input.bodyHtml}
          <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:13px;line-height:1.6;color:#64748b;">
            ${escapeHtml(input.footer)}
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`
}

export class NotificationApplicationService {
  private readonly notificationRepository: NotificationRepository
  private readonly mailClient: NotificationMailClient

  constructor(dependencies?: { notificationRepository?: NotificationRepository; mailClient?: NotificationMailClient }) {
    this.notificationRepository = dependencies?.notificationRepository ?? new NotificationRepository()
    this.mailClient = dependencies?.mailClient ?? createNotificationMailClient()
  }

  private getHourInTimezone(now: Date, timezone: string) {
    const rawHour = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      hour12: false,
    }).format(now)

    return Number.parseInt(rawHour, 10)
  }

  private isReminderDue(
    lastSentAt: Date | null,
    frequency: NotificationFrequency,
    reminderHour: number,
    currentHour: number,
    now: Date
  ) {
    if (frequency === 'disabled') {
      return false
    }

    const normalizedReminderHour = Number.isInteger(reminderHour) && reminderHour >= 0 && reminderHour <= 23
      ? reminderHour
      : 9

    if (currentHour !== normalizedReminderHour) {
      return false
    }

    if (!lastSentAt) {
      return true
    }

    const elapsedMs = now.getTime() - lastSentAt.getTime()
    const requiredMs = REMINDER_INTERVAL_DAYS[frequency] * 24 * 60 * 60 * 1000

    return elapsedMs >= requiredMs
  }

  async listUserNotifications(userEmail: string) {
    const user = await this.notificationRepository.findUserByEmail(userEmail)

    if (!user) {
      throw new HttpError(404, { error: 'Authenticated user not found' })
    }

    const rows = await this.notificationRepository.listUserNotifications(user.id)

    return {
      notifications: rows,
      unreadCount: rows.filter((notification) => !notification.read).length,
    }
  }

  async createUserNotification(input: CreateUserNotificationInput) {
    const recipient = await this.notificationRepository.findUserById(input.userId)

    if (!recipient) {
      throw new HttpError(404, { error: 'Notification recipient not found' })
    }

    const created = await this.notificationRepository.createNotification(input)

    return {
      notification: created,
      message: 'Notification created successfully',
    }
  }

  async sendUserEmail(input: SendUserEmailInput) {
    const recipient = await this.notificationRepository.findUserById(input.userId)

    if (!recipient) {
      throw new HttpError(404, { error: 'Notification recipient not found' })
    }

    const created = await this.notificationRepository.createNotification({
      userId: input.userId,
      type: input.type,
      content: input.content,
    })

    const senderEmail = resolveNotificationSenderEmail()

    await this.mailClient.sendMail({
      from: senderEmail,
      to: recipient.email,
      subject: input.subject,
      text: input.content,
      html: buildEmailShell({
        title: input.subject,
        intro: 'Se ha generado una nueva notificación en Match-TFE.',
        bodyHtml: `<div style="padding:18px 20px;border:1px solid #dbeafe;border-radius:18px;background:#f8fbff;">
          ${multilineToHtml(input.content)}
        </div>`,
        footer: 'Si no esperabas este mensaje, puedes ignorarlo.',
      }),
    })

    return {
      notification: created,
      message: 'Email sent successfully',
    }
  }

  async markNotificationAsRead(userEmail: string, notificationId: number) {
    const user = await this.notificationRepository.findUserByEmail(userEmail)

    if (!user) {
      throw new HttpError(404, { error: 'Authenticated user not found' })
    }

    const updated = await this.notificationRepository.markNotificationAsRead(user.id, notificationId)

    if (!updated) {
      throw new HttpError(404, { error: 'Notification not found' })
    }

    return {
      notification: updated,
      message: 'Notification marked as read',
    }
  }

  async clearUserNotifications(userEmail: string) {
    const user = await this.notificationRepository.findUserByEmail(userEmail)

    if (!user) {
      throw new HttpError(404, { error: 'Authenticated user not found' })
    }

    const deletedRows = await this.notificationRepository.clearUserNotifications(user.id)

    return {
      deleted: deletedRows.length,
      message: 'Notifications cleared successfully',
    }
  }

  async deleteNotification(userEmail: string, notificationId: number) {
    const user = await this.notificationRepository.findUserByEmail(userEmail)

    if (!user) {
      throw new HttpError(404, { error: 'Authenticated user not found' })
    }

    const deleted = await this.notificationRepository.deleteNotification(user.id, notificationId)

    if (!deleted) {
      throw new HttpError(404, { error: 'Notification not found' })
    }

    return {
      deleted: true,
      notificationId,
      message: 'Notification deleted successfully',
    }
  }

  async sendUnreadNotificationsSummaryEmails(timezone: string) {
    const unreadRows = await this.notificationRepository.getUnreadNotifications()

    if (unreadRows.length === 0) {
      return { sent: 0, failed: 0, recipients: [], message: 'No unread notifications found' }
    }

    const unreadByUserId = new Map<number, UnreadNotificationRow[]>()

    for (const row of unreadRows) {
      if (!row.userId) {
        continue
      }

      const current = unreadByUserId.get(row.userId) ?? []
      current.push({
        userId: row.userId,
        type: row.type,
        content: row.content,
        timestamp: row.timestamp,
      })
      unreadByUserId.set(row.userId, current)
    }

    const userIds = [...unreadByUserId.keys()]

    const userRows = await this.notificationRepository.getUsersForReminder(userIds)

    const now = new Date()
    const currentHour = this.getHourInTimezone(now, timezone)
    const dueUsers = userRows.filter((user) => this.isReminderDue(
      user.lastReminderEmailSentAt,
      (user.notificationFrequency as NotificationFrequency) ?? 'disabled',
      user.notificationReminderHour,
      currentHour,
      now
    ))

    if (dueUsers.length === 0) {
      return {
        sent: 0,
        failed: 0,
        recipients: [],
        skipped: userRows.length,
        message: 'No reminder emails were due for the configured user frequencies',
      }
    }

    const subject = process.env.PENDING_MATCHES_SUBJECT ?? 'Resumen de notificaciones pendientes en Match-TFE'
    const senderEmail = resolveNotificationSenderEmail()

    const sendResults = await Promise.allSettled(dueUsers.map(async (user) => {
      const unreadForUser = unreadByUserId.get(user.id) ?? []

      const lines = unreadForUser
        .slice(0, 10)
        .map((notification, index) => `${index + 1}. [${notification.type}] ${notification.content}`)

      const moreLine = unreadForUser.length > 10
        ? `\nY ${unreadForUser.length - 10} notificaciones más sin leer.`
        : ''

      const text = `Hola ${user.name},\n\nTienes ${unreadForUser.length} notificaciones sin leer en Match-TFE.\n\nResumen:\n${lines.join('\n')}${moreLine}\n\nEntra en la plataforma para revisarlas.\n\nUn saludo,\nEquipo Match-TFE`
      const htmlItems = unreadForUser
        .slice(0, 10)
        .map((notification) => `<li style="margin:0 0 12px;padding:14px 16px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc;"><div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;margin-bottom:6px;">${escapeHtml(notification.type)}</div><div style="font-size:15px;line-height:1.6;color:#0f172a;">${escapeHtml(notification.content).replace(/\n/g, '<br/>')}</div></li>`)
        .join('')
      const htmlMoreLine = unreadForUser.length > 10
        ? `<p style="margin:16px 0 0;color:#475569;">Y ${unreadForUser.length - 10} notificaciones más sin leer.</p>`
        : ''

      await this.mailClient.sendMail({
        from: senderEmail,
        to: user.email,
        subject,
        text,
        html: buildEmailShell({
          title: 'Resumen de notificaciones pendientes',
          intro: `Hola ${user.name}, tienes ${unreadForUser.length} notificaciones sin leer en Match-TFE.`,
          bodyHtml: `<div style="margin:0 0 24px;padding:20px;border-radius:18px;background:linear-gradient(180deg,#eff6ff 0%,#ffffff 100%);border:1px solid #bfdbfe;">
            <div style="font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#2563eb;margin-bottom:6px;">Pendientes</div>
            <div style="font-size:42px;line-height:1;font-weight:800;color:#0f172a;">${unreadForUser.length}</div>
            <div style="margin-top:8px;font-size:14px;line-height:1.6;color:#475569;">Este resumen se genera automáticamente con el cronjob programado.</div>
          </div>
          <div style="margin-bottom:10px;font-size:15px;font-weight:700;color:#0f172a;">Resumen</div>
          <ul style="list-style:none;padding:0;margin:0;">${htmlItems}</ul>
          ${htmlMoreLine}`,
          footer: 'Entra en Match-TFE para revisarlas. Un saludo, Equipo Match-TFE.',
        }),
      })

      return user.email
    }))

    const sentTo = sendResults
      .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
      .map((result) => result.value)

    const sentUserIds = dueUsers
      .filter((_, index) => sendResults[index]?.status === 'fulfilled')
      .map((user) => user.id)

    if (sentUserIds.length > 0) {
      await this.notificationRepository.updateLastReminderSentAt(sentUserIds, new Date())
    }

    const failedCount = sendResults.length - sentTo.length

    return {
      sent: sentTo.length,
      failed: failedCount,
      recipients: sentTo,
      skipped: userRows.length - dueUsers.length,
      message: failedCount > 0
        ? 'Unread notification summaries sent with partial failures'
        : 'Unread notification summaries sent successfully',
    }
  }

  async sendEmailToStudents(input: SendStudentsEmailInput) {
    const requester = await this.notificationRepository.findUserByEmail(input.requesterEmail)

    if (!requester) {
      throw new HttpError(404, { error: 'Authenticated user not found' })
    }

    if (requester.role !== 'professor') {
      throw new HttpError(403, { error: 'Only professors can send emails to students' })
    }

    const idTargets = [...new Set(input.studentIds ?? [])]
    const emailTargets = [...new Set(input.studentEmails ?? [])]

    const recipientFilter = idTargets.length > 0 && emailTargets.length > 0
      ? { ids: idTargets, emails: emailTargets }
      : idTargets.length > 0
        ? { ids: idTargets }
        : { emails: emailTargets }

    const studentRows = await this.notificationRepository.findStudentsByFilter(recipientFilter)

    if (studentRows.length === 0) {
      throw new HttpError(404, { error: 'No student recipients found' })
    }

    const senderEmail = resolveNotificationSenderEmail()

    const sendResults = await Promise.allSettled(studentRows.map(async (student) => {
      await this.mailClient.sendMail({
        from: senderEmail,
        to: student.email,
        subject: input.subject,
        text: input.message,
        html: buildEmailShell({
          title: input.subject,
          intro: `Hola ${student.name}, tienes un mensaje nuevo en Match-TFE.`,
          bodyHtml: `<div style="padding:18px 20px;border:1px solid #dbeafe;border-radius:18px;background:#f8fbff;">
            ${multilineToHtml(input.message)}
          </div>`,
          footer: 'Mensaje enviado desde Match-TFE.',
        }),
      })
      return student.email
    }))

    const sentTo = sendResults
      .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
      .map((result) => result.value)

    const failedCount = sendResults.length - sentTo.length

    return {
      sent: sentTo.length,
      failed: failedCount,
      recipients: sentTo,
      message: failedCount > 0
        ? 'Email delivery completed with partial failures'
        : 'Emails sent successfully',
    }
  }
}
