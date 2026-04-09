import db from '@match-tfe/db'
import { matches, projects, projectTags, tags, userTags, users } from '@match-tfe/db/schema'
import { and, desc, eq, inArray, or } from 'drizzle-orm'

export class UserRepository {
  transaction<T>(callback: (client: any) => Promise<T>) {
    return db.transaction(callback)
  }

  async findByEmail(email: string) {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
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

  async findById(userId: number) {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
        biography: users.biography,
        role: users.role,
        registrationDate: users.registrationDate,
        notificationFrequency: users.notificationFrequency,
        notificationReminderHour: users.notificationReminderHour,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return user ?? null
  }

  async findRoleById(userId: number) {
    const [user] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return user ?? null
  }

  async createStudent(input: {
    email: string
    name: string
    surname: string
    passwordHash: string
    registrationDate: Date
  }, client: any = db) {
    const insertion = client
      .insert(users)
      .values({
        email: input.email,
        name: input.name,
        surname: input.surname,
        passwordHash: input.passwordHash,
        registrationDate: input.registrationDate,
        role: 'student',
      })

    if (typeof insertion?.returning === 'function') {
      const [createdUser] = await insertion.returning({ id: users.id })
      return createdUser ?? null
    }

    await insertion

    return null
  }

  async createProfessor(input: {
    email: string
    name: string
    surname: string
    passwordHash: string
    registrationDate: Date
  }, client: any = db) {
    const insertion = client
      .insert(users)
      .values({
        email: input.email,
        name: input.name,
        surname: input.surname,
        passwordHash: input.passwordHash,
        registrationDate: input.registrationDate,
        role: 'professor',
      })

    if (typeof insertion?.returning === 'function') {
      const [createdUser] = await insertion.returning({ id: users.id })
      return createdUser ?? null
    }

    await insertion

    return null
  }

  async getProposalsForUser(userId: number, role: 'student' | 'professor') {
    return db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        type: projects.tfeType,
        publicationDate: projects.publicationDate,
        status: projects.status,
      })
      .from(projects)
      .where(eq(projects.proposerId, userId))
      .orderBy(desc(projects.publicationDate))
  }

  async getProposalTags(proposalId: number) {
    const rows = await db
      .select({ name: tags.name })
      .from(tags)
      .innerJoin(projectTags, eq(projectTags.tagId, tags.id))
      .where(eq(projectTags.projectId, proposalId))

    return rows.map((row) => row.name)
  }

  async getInterests(userId: number) {
    const rows = await db
      .select({ name: tags.name })
      .from(userTags)
      .innerJoin(tags, eq(tags.id, userTags.tagId))
      .where(eq(userTags.userId, userId))

    return rows.map((row) => row.name)
  }

  async findTagsByNames(tagNames: string[]) {
    if (tagNames.length === 0) {
      return []
    }

    return db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .where(inArray(tags.name, tagNames))
  }

  async hasAcceptedMatchBetweenUsers(requesterId: number, profileId: number) {
    const [acceptedBetweenUsers] = await db
      .select({ projectId: matches.projectId })
      .from(matches)
      .innerJoin(projects, eq(projects.id, matches.projectId))
      .where(and(
        eq(matches.status, 'accepted'),
        or(
          and(
            eq(matches.userId, requesterId),
            eq(projects.proposerId, profileId)
          ),
          and(
            eq(matches.userId, profileId),
            eq(projects.proposerId, requesterId)
          )
        )
      ))
      .limit(1)

    return Boolean(acceptedBetweenUsers)
  }

  async updateUser(userId: number, update: { name?: string; surname?: string; email?: string; biography?: string | null }) {
    const updateData: Record<string, unknown> = {}

    if (update.name !== undefined) updateData.name = update.name
    if (update.surname !== undefined) updateData.surname = update.surname
    if (update.email !== undefined) updateData.email = update.email
    if (update.biography !== undefined) updateData.biography = update.biography

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
  }

  async updateNotificationFrequency(userId: number, notificationFrequency: 'disabled' | 'daily' | 'weekly' | 'biweekly' | 'monthly') {
    const updateData: Record<string, unknown> = { notificationFrequency }

    if (notificationFrequency === 'disabled') {
      updateData.lastReminderEmailSentAt = null
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
  }

  async updateNotificationReminderHour(userId: number, notificationReminderHour: number) {
    await db
      .update(users)
      .set({ notificationReminderHour })
      .where(eq(users.id, userId))
  }

  async deleteUser(userId: number, client: any = db) {
    await client
      .delete(users)
      .where(eq(users.id, userId))
  }

  async listUsers() {
    return db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
        role: users.role,
        registrationDate: users.registrationDate,
        biography: users.biography,
      })
      .from(users)
      .orderBy(desc(users.registrationDate))
  }

  async replaceUserInterests(userId: number, tagIds: number[], client: any = db) {
    await client.delete(userTags).where(eq(userTags.userId, userId))

    if (tagIds.length > 0) {
      await client
        .insert(userTags)
        .values(tagIds.map((tagId) => ({ userId, tagId })))
    }
  }

  async findPublicProfileById(userId: number) {
    const [profile] = await db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
        biography: users.biography,
        role: users.role,
        registrationDate: users.registrationDate,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return profile ?? null
  }

  async findRequesterByEmail(email: string) {
    const [requester] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return requester ?? null
  }
}
