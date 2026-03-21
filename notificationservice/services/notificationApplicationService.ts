import nodemailer from 'nodemailer'
import db from '@match-tfe/db'
import { matches, notifications, projects, users } from '@match-tfe/db/schema'
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

export class NotificationApplicationService {
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

  async sendPendingMatchesReminderEmails() {
    const pendingForStudentProposals = await db
      .select({ studentId: projects.studentId })
      .from(matches)
      .innerJoin(projects, eq(projects.id, matches.projectId))
      .where(and(
        eq(matches.status, 'pending'),
        isNotNull(projects.studentId)
      ))

    const pendingRequestedByStudents = await db
      .select({ studentId: users.id })
      .from(matches)
      .innerJoin(users, eq(users.id, matches.userId))
      .where(and(
        eq(matches.status, 'pending'),
        eq(users.role, 'student')
      ))

    const pendingCountsByStudent = new Map<number, number>()

    for (const row of pendingForStudentProposals) {
      if (!row.studentId) {
        continue
      }

      pendingCountsByStudent.set(row.studentId, (pendingCountsByStudent.get(row.studentId) ?? 0) + 1)
    }

    for (const row of pendingRequestedByStudents) {
      pendingCountsByStudent.set(row.studentId, (pendingCountsByStudent.get(row.studentId) ?? 0) + 1)
    }

    const studentIds = [...pendingCountsByStudent.keys()]

    if (studentIds.length === 0) {
      return { sent: 0, failed: 0, recipients: [], message: 'No pending student matches found' }
    }

    const studentRows = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(and(
        eq(users.role, 'student'),
        inArray(users.id, studentIds)
      ))

    const subject = process.env.PENDING_MATCHES_SUBJECT ?? 'Tienes matches pendientes en Match-TFE'
    const senderEmail = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'no-reply@matchtfe.local'
    const transporter = this.createTransporter()

    const sendResults = await Promise.allSettled(studentRows.map(async (student) => {
      const pendingCount = pendingCountsByStudent.get(student.id) ?? 1
      const plural = pendingCount === 1 ? '' : 's'
      const text = `Hola ${student.name},\n\nTienes ${pendingCount} match${plural} pendiente${plural} en Match-TFE.\n\nEntra en la plataforma para revisar tus propuestas y responder a tiempo.\n\nUn saludo,\nEquipo Match-TFE`

      await transporter.sendMail({
        from: senderEmail,
        to: student.email,
        subject,
        text,
        html: `<p>Hola ${student.name},</p><p>Tienes <strong>${pendingCount}</strong> match${plural} pendiente${plural} en Match-TFE.</p><p>Entra en la plataforma para revisar tus propuestas y responder a tiempo.</p><p>Un saludo,<br/>Equipo Match-TFE</p>`,
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
        ? 'Pending-match reminders sent with partial failures'
        : 'Pending-match reminders sent successfully',
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
