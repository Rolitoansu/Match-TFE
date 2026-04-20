import db from '@match-tfe/db'
import { administrators, tags, userTags, users } from '@match-tfe/db/schema'
import { eq } from 'drizzle-orm'

const selectUserFields = {
  id: users.id,
  name: users.name,
  surname: users.surname,
  registrationDate: users.registrationDate,
  biography: users.biography,
  notificationFrequency: users.notificationFrequency,
  notificationReminderHour: users.notificationReminderHour,
  role: users.role,
}

export class AuthRepository {
  private async findUserByEmail(email: string) {
    const [user] = await db.select(selectUserFields).from(users).where(eq(users.email, email)).limit(1)
    return user ?? null
  }

  async getUserSessionByEmail(email: string) {
    return this.findUserByEmail(email)
  }

  async getUserPasswordByEmail(email: string) {
    const [user] = await db
      .select({ ...selectUserFields, passwordHash: users.passwordHash })
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
