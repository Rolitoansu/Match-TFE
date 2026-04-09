import db from '@match-tfe/db'
import { administrators, tags, userTags, users } from '@match-tfe/db/schema'
import { eq } from 'drizzle-orm'

export class AuthRepository {
  async getUserSessionByEmail(email: string) {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        registrationDate: users.registrationDate,
        biography: users.biography,
        notificationFrequency: users.notificationFrequency,
        notificationReminderHour: users.notificationReminderHour,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return user ?? null
  }

  async getUserPasswordByEmail(email: string) {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        passwordHash: users.passwordHash,
        registrationDate: users.registrationDate,
        biography: users.biography,
        notificationFrequency: users.notificationFrequency,
        notificationReminderHour: users.notificationReminderHour,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return user ?? null
  }

  async getUserInterests(userId: number) {
    const interestRows = await db
      .select({ name: tags.name })
      .from(userTags)
      .innerJoin(tags, eq(tags.id, userTags.tagId))
      .where(eq(userTags.userId, userId))

    return interestRows.map((row) => row.name)
  }

  async getAdminByEmail(email: string) {
    const [admin] = await db
      .select({
        id: administrators.id,
        email: administrators.email,
        passwordHash: administrators.passwordHash,
      })
      .from(administrators)
      .where(eq(administrators.email, email))
      .limit(1)

    return admin ?? null
  }
}
