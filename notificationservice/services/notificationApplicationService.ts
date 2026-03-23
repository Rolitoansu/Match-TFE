import nodemailer from 'nodemailer'
import db from '@match-tfe/db'
import { notifications, users } from '@match-tfe/db/schema'
import { and, desc, eq, inArray, isNotNull, or } from 'drizzle-orm'

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

export class NotificationApplicationService {
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
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1)

    if (!user) {
      throw new HttpError(404, { error: 'Authenticated user not found' })
    }

    const rows = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        content: notifications.content,
        read: notifications.read,
        timestamp: notifications.timestamp,
      })
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.timestamp))
      .limit(50)

    return {
      notifications: rows,
      unreadCount: rows.filter((notification) => !notification.read).length,
    }
  }

  async createUserNotification(input: CreateUserNotificationInput) {
    const [recipient] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1)

    if (!recipient) {
      throw new HttpError(404, { error: 'Notification recipient not found' })
    }

    const [created] = await db
      .insert(notifications)
      .values({
        type: input.type,
        content: input.content,
        userId: input.userId,
      })
      .returning({
        id: notifications.id,
        type: notifications.type,
        content: notifications.content,
        read: notifications.read,
        timestamp: notifications.timestamp,
      })

    return {
      notification: created,
      message: 'Notification created successfully',
    }
  }

  async markNotificationAsRead(userEmail: string, notificationId: number) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1)

    if (!user) {
      throw new HttpError(404, { error: 'Authenticated user not found' })
    }

    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, user.id)
      ))
      .returning({
        id: notifications.id,
        type: notifications.type,
        content: notifications.content,
        read: notifications.read,
        timestamp: notifications.timestamp,
      })

    if (!updated) {
      throw new HttpError(404, { error: 'Notification not found' })
    }

    return {
      notification: updated,
      message: 'Notification marked as read',
    }
  }

  async clearUserNotifications(userEmail: string) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1)

    if (!user) {
      throw new HttpError(404, { error: 'Authenticated user not found' })
    }

    const deletedRows = await db
      .delete(notifications)
      .where(eq(notifications.userId, user.id))
      .returning({ id: notifications.id })

    return {
      deleted: deletedRows.length,
      message: 'Notifications cleared successfully',
    }
  }

  async deleteNotification(userEmail: string, notificationId: number) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1)

    if (!user) {
      throw new HttpError(404, { error: 'Authenticated user not found' })
    }

    const [deleted] = await db
      .delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, user.id)
      ))
      .returning({ id: notifications.id })

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
    const unreadRows = await db
      .select({
        userId: notifications.userId,
        type: notifications.type,
        content: notifications.content,
        timestamp: notifications.timestamp,
      })
      .from(notifications)
      .where(and(
        eq(notifications.read, false),
        isNotNull(notifications.userId)
      ))
      .orderBy(desc(notifications.timestamp))

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

    const userRows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        notificationFrequency: users.notificationFrequency,
        notificationReminderHour: users.notificationReminderHour,
        lastReminderEmailSentAt: users.lastReminderEmailSentAt,
      })
      .from(users)
      .where(inArray(users.id, userIds))

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
    const senderEmail = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'no-reply@matchtfe.local'
    const transporter = this.createTransporter()

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
        .map((notification) => `<li><strong>[${notification.type}]</strong> ${notification.content}</li>`)
        .join('')
      const htmlMoreLine = unreadForUser.length > 10
        ? `<p>Y ${unreadForUser.length - 10} notificaciones más sin leer.</p>`
        : ''

      await transporter.sendMail({
        from: senderEmail,
        to: user.email,
        subject,
        text,
        html: `<p>Hola ${user.name},</p><p>Tienes <strong>${unreadForUser.length}</strong> notificaciones sin leer en Match-TFE.</p><p>Resumen:</p><ol>${htmlItems}</ol>${htmlMoreLine}<p>Entra en la plataforma para revisarlas.</p><p>Un saludo,<br/>Equipo Match-TFE</p>`,
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
      await db
        .update(users)
        .set({ lastReminderEmailSentAt: new Date() })
        .where(inArray(users.id, sentUserIds))
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
    const [requester] = await db
      .select({ id: users.id, role: users.role, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.email, input.requesterEmail))
      .limit(1)

    if (!requester) {
      throw new HttpError(404, { error: 'Authenticated user not found' })
    }

    if (requester.role !== 'professor') {
      throw new HttpError(403, { error: 'Only professors can send emails to students' })
    }

    const idTargets = [...new Set(input.studentIds ?? [])]
    const emailTargets = [...new Set(input.studentEmails ?? [])]

    const recipientFilter = idTargets.length > 0 && emailTargets.length > 0
      ? or(inArray(users.id, idTargets), inArray(users.email, emailTargets))
      : idTargets.length > 0
        ? inArray(users.id, idTargets)
        : inArray(users.email, emailTargets)

    const studentRows = await db
      .select({ id: users.id, email: users.email, name: users.name, surname: users.surname })
      .from(users)
      .where(and(
        eq(users.role, 'student'),
        recipientFilter
      ))

    if (studentRows.length === 0) {
      throw new HttpError(404, { error: 'No student recipients found' })
    }

    const senderEmail = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'no-reply@matchtfe.local'
    const transporter = this.createTransporter()

    const sendResults = await Promise.allSettled(studentRows.map(async (student) => {
      await transporter.sendMail({
        from: senderEmail,
        to: student.email,
        subject: input.subject,
        text: input.message,
        html: `<p>${input.message.replace(/\n/g, '<br/>')}</p>`,
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

  private createTransporter() {
    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT ?? 587)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (!host || !user || !pass) {
      return nodemailer.createTransport({ jsonTransport: true })
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })
  }
}
