import db from '@match-tfe/db'
import { notifications, users } from '@match-tfe/db/schema'
import { and, desc, eq, inArray, isNotNull, or } from 'drizzle-orm'

export class NotificationRepository {
  async findUserByEmail(email: string) {
    const [user] = await db
      .select({ id: users.id, role: users.role, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return user ?? null
  }

  async findUserById(userId: number) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return user ?? null
  }

  async listUserNotifications(userId: number) {
    return db
      .select({
        id: notifications.id,
        type: notifications.type,
        content: notifications.content,
        read: notifications.read,
        timestamp: notifications.timestamp,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.timestamp))
      .limit(50)
  }

  async createNotification(input: { userId: number; type: string; content: string }) {
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

    return created ?? null
  }

  async markNotificationAsRead(userId: number, notificationId: number) {
    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning({
        id: notifications.id,
        type: notifications.type,
        content: notifications.content,
        read: notifications.read,
        timestamp: notifications.timestamp,
      })

    return updated ?? null
  }

  async clearUserNotifications(userId: number) {
    return db
      .delete(notifications)
      .where(eq(notifications.userId, userId))
      .returning({ id: notifications.id })
  }

  async deleteNotification(userId: number, notificationId: number) {
    const [deleted] = await db
      .delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning({ id: notifications.id })

    return deleted ?? null
  }

  async getUnreadNotifications() {
    return db
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
  }

  async getUsersForReminder(userIds: number[]) {
    return db
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
  }

  async updateLastReminderSentAt(userIds: number[], sentAt: Date) {
    await db
      .update(users)
      .set({ lastReminderEmailSentAt: sentAt })
      .where(inArray(users.id, userIds))
  }

  async findStudentsByFilter(filter: { ids?: number[]; emails?: string[] }) {
    const filterByIds = filter.ids && filter.ids.length > 0 ? inArray(users.id, filter.ids) : null
    const filterByEmails = filter.emails && filter.emails.length > 0 ? inArray(users.email, filter.emails) : null

    const recipientFilter = filterByIds && filterByEmails
      ? or(filterByIds, filterByEmails)
      : filterByIds ?? filterByEmails

    if (!recipientFilter) {
      return []
    }

    return db
      .select({ id: users.id, email: users.email, name: users.name, surname: users.surname })
      .from(users)
      .where(and(
        eq(users.role, 'student'),
        recipientFilter
      ))
  }
}
