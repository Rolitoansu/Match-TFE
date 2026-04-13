import db from '@match-tfe/db'
import { matches, projects, projectTags, tags, userTags, users } from '@match-tfe/db/schema'
import { and, desc, eq, inArray, ne } from 'drizzle-orm'

export class ProjectRepository {
  transaction<T>(callback: (client: any) => Promise<T>) {
    return db.transaction(callback)
  }

  async getCurrentUserByEmail(userEmail: string) {
    const [user] = await db
      .select({
        id: users.id,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1)

    if (!user || (user.role !== 'student' && user.role !== 'professor')) {
      return null
    }

    return user as { id: number; role: 'student' | 'professor' }
  }

  async getAcceptedMatchContext(userId: number) {
    const [acceptedAsInterestedUser] = await db
      .select({ projectId: matches.projectId })
      .from(matches)
      .where(and(
        eq(matches.userId, userId),
        eq(matches.status, 'accepted')
      ))
      .limit(1)

    if (acceptedAsInterestedUser) {
      const [project] = await db
        .select({
          id: projects.id,
          title: projects.title,
          description: projects.description,
          type: projects.tfeType,
          publicationDate: projects.publicationDate,
          status: projects.status,
          proposerId: projects.proposerId,
        })
        .from(projects)
        .where(eq(projects.id, acceptedAsInterestedUser.projectId))
        .limit(1)

      if (!project) {
        return null
      }

      const counterpartUserId = project.proposerId

      if (!counterpartUserId) {
        return null
      }

      const [counterpart] = await db
        .select({
          id: users.id,
          name: users.name,
          surname: users.surname,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, counterpartUserId))
        .limit(1)

      if (!counterpart) {
        return null
      }

      return { project, counterpart }
    }

    const [acceptedAsOwner] = await db
      .select({ projectId: projects.id, interestedUserId: matches.userId })
      .from(projects)
      .innerJoin(matches, eq(matches.projectId, projects.id))
      .where(and(
        eq(matches.status, 'accepted'),
        eq(projects.proposerId, userId)
      ))
      .limit(1)

    if (!acceptedAsOwner) {
      return null
    }

    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        type: projects.tfeType,
        publicationDate: projects.publicationDate,
        status: projects.status,
      })
      .from(projects)
      .where(eq(projects.id, acceptedAsOwner.projectId))
      .limit(1)

    if (!project) {
      return null
    }

    const [counterpart] = await db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, acceptedAsOwner.interestedUserId))
      .limit(1)

    if (!counterpart) {
      return null
    }

    return { project, counterpart }
  }

  async getProposalListByRole(role: 'student' | 'professor', _userId: number) {
    return db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        type: projects.tfeType,
        publicationDate: projects.publicationDate,
        status: projects.status,
        proposerId: projects.proposerId,
        creatorName: users.name,
        creatorSurname: users.surname,
      })
      .from(projects)
      .innerJoin(users, eq(users.id, projects.proposerId))
      .where(role === 'student' ? eq(users.role, 'professor') : eq(users.role, 'student'))
      .orderBy(desc(projects.publicationDate))
      .limit(50)
  }

  async findTagsByNames(tagNames: string[], client: any = db) {
    if (tagNames.length === 0) {
      return []
    }

    return client
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .where(inArray(tags.name, tagNames))
  }

  async getProjectTagNames(projectId: number) {
    const proposalTags = await db
      .select({ name: tags.name })
      .from(tags)
      .innerJoin(projectTags, eq(projectTags.tagId, tags.id))
      .where(eq(projectTags.projectId, projectId))

    return proposalTags.map((tag) => tag.name)
  }

  async getProjectTagIds(projectId: number) {
    const proposalTagIds = await db
      .select({ id: projectTags.tagId })
      .from(projectTags)
      .where(eq(projectTags.projectId, projectId))

    return proposalTagIds.map((tag) => tag.id)
  }

  async getCurrentUserInterests(userId: number) {
    const currentUserInterestRows = await db
      .select({ tagId: userTags.tagId })
      .from(userTags)
      .where(eq(userTags.userId, userId))

    return new Set(currentUserInterestRows.map((row) => row.tagId))
  }

  async getRawProposals(userRole: 'student' | 'professor', currentUserId: number) {
    return db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        type: projects.tfeType,
        publicationDate: projects.publicationDate,
        status: projects.status,
        creatorId: users.id,
        creatorName: users.name,
        creatorSurname: users.surname,
        creatorBiography: users.biography,
        proposerId: projects.proposerId,
      })
      .from(projects)
      .innerJoin(users, eq(users.id, projects.proposerId))
      .where(and(
        eq(projects.status, 'proposed'),
        ne(users.id, currentUserId),
        userRole === 'student' ? eq(users.role, 'professor') : eq(users.role, 'student')
      ))
      .orderBy(desc(projects.publicationDate))
  }

  async findAcceptedMatchByProjectId(projectId: number, client: any = db) {
    const [acceptedMatch] = await client
      .select({ projectId: matches.projectId })
      .from(matches)
      .where(and(eq(matches.projectId, projectId), eq(matches.status, 'accepted')))
      .limit(1)

    return acceptedMatch ?? null
  }

  async findExistingMatch(projectId: number, userId: number, client: any = db) {
    const [existingMatch] = await client
      .select({ status: matches.status })
      .from(matches)
      .where(and(eq(matches.projectId, projectId), eq(matches.userId, userId)))
      .limit(1)

    return existingMatch ?? null
  }

  async deleteMatch(projectId: number, userId: number, client: any = db) {
    await client
      .delete(matches)
      .where(and(eq(matches.projectId, projectId), eq(matches.userId, userId)))
  }

  async findProjectById(projectId: number, client: any = db) {
    const query = client
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        type: projects.tfeType,
        publicationDate: projects.publicationDate,
        status: projects.status,
        proposerId: projects.proposerId,
      })
      .from(projects)
      .where(eq(projects.id, projectId))

    const rows = typeof query.limit === 'function'
      ? await query.limit(1)
      : await query

    const [project] = rows

    return project ?? null
  }

  async getProjectOwnerById(ownerId: number, client: any = db) {
    const [owner] = await client
      .select({ id: users.id, name: users.name, surname: users.surname, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, ownerId))
      .limit(1)

    return owner ?? null
  }

  async getProjectMatches(projectId: number, client: any = db) {
    const query = client
      .select({ userId: matches.userId, status: matches.status })
      .from(matches)
      .where(eq(matches.projectId, projectId))

    if (Array.isArray(query)) {
      return query
    }

    if (typeof query?.then === 'function') {
      return await query
    }

    if (typeof query?.limit === 'function') {
      return await query.limit(1000)
    }

    return []
  }

  async getInterestedUsers(projectId: number) {
    return db
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
        matchStatus: matches.status,
      })
      .from(matches)
      .innerJoin(users, eq(users.id, matches.userId))
      .where(and(
        eq(matches.projectId, projectId),
        inArray(matches.status, ['pending', 'accepted'])
      ))
  }

  async getUsersByIds(userIds: number[]) {
    if (userIds.length === 0) {
      return []
    }

    return db
      .select({ id: users.id, name: users.name, surname: users.surname, email: users.email })
      .from(users)
      .where(inArray(users.id, userIds))
  }

  async getTags() {
    return db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .orderBy(tags.name)
  }

  async findTagByName(name: string) {
    const [tag] = await db
      .select()
      .from(tags)
      .where(eq(tags.name, name))
      .limit(1)

    return tag ?? null
  }

  async createTag(name: string) {
    const [tag] = await db
      .insert(tags)
      .values({ name })
      .returning({ id: tags.id, name: tags.name })

    return tag ?? null
  }

  async deleteTag(tagId: number) {
    const deletedRows = await db
      .delete(tags)
      .where(eq(tags.id, tagId))
      .returning({ id: tags.id })

    return deletedRows
  }

  async updateTag(tagId: number, name: string) {
    const updatedRows = await db
      .update(tags)
      .set({ name })
      .where(eq(tags.id, tagId))
      .returning({ id: tags.id, name: tags.name })

    return updatedRows
  }

  async createProposal(userRole: 'student' | 'professor', currentUserId: number, input: { title: string; description?: string; type: number }, client: any = db) {
    const [project] = await client
      .insert(projects)
      .values({ title: input.title, description: input.description, tfeType: input.type, proposerId: currentUserId })
      .returning({ id: projects.id })

    return project ?? null
  }

  async createProjectTags(projectId: number, tagIds: number[], client: any = db) {
    await client
      .insert(projectTags)
      .values(tagIds.map((tagId) => ({ projectId, tagId })))
  }

  async updateProjectPublicationDate(projectId: number, publicationDate: Date) {
    await db
      .update(projects)
      .set({ publicationDate })
      .where(eq(projects.id, projectId))
  }

  async updateProjectStatus(projectId: number, status: 'proposed' | 'in_progress' | 'completed') {
    await db
      .update(projects)
      .set({ status })
      .where(eq(projects.id, projectId))
  }

  async updateProjectStatusInTransaction(projectId: number, status: 'proposed' | 'in_progress' | 'completed', client: any) {
    await client
      .update(projects)
      .set({ status })
      .where(eq(projects.id, projectId))
  }

  async rejectPendingMatchesForProject(projectId: number, client: any) {
    await client
      .update(matches)
      .set({ status: 'rejected' })
      .where(and(
        eq(matches.projectId, projectId),
        eq(matches.status, 'pending')
      ))
  }

  async assignMatchedParticipant(_projectId: number, _proposal: unknown, _interestedUserId: number, _client: any) {
    // With proposer_id as the only owner field, accepted participant is inferred from matches.
  }

  async deleteAcceptedMatch(projectId: number, acceptedUserId?: number, client: any = db) {
    const condition = acceptedUserId === undefined
      ? and(eq(matches.projectId, projectId), eq(matches.status, 'accepted'))
      : and(eq(matches.projectId, projectId), eq(matches.userId, acceptedUserId))

    await client
      .delete(matches)
      .where(condition)
  }

  async insertMatch(projectId: number, userId: number, status: 'pending' | 'rejected' | 'accepted', client: any = db) {
    await client
      .insert(matches)
      .values({ projectId, userId, status })
  }

  async updateMatchStatus(projectId: number, userId: number | null, status: 'pending' | 'rejected' | 'accepted', client: any = db) {
    const condition = userId === null
      ? eq(matches.projectId, projectId)
      : and(eq(matches.projectId, projectId), eq(matches.userId, userId))

    await client
      .update(matches)
      .set({ status })
      .where(condition)
  }

  async findPendingMatch(projectId: number, userId: number, client: any = db) {
    const [candidateLike] = await client
      .select({ userId: matches.userId })
      .from(matches)
      .where(and(
        eq(matches.projectId, projectId),
        eq(matches.userId, userId),
        eq(matches.status, 'pending')
      ))
      .limit(1)

    return candidateLike ?? null
  }

  async findAcceptedMatchUserId(projectId: number, client: any = db) {
    const [acceptedMatch] = await client
      .select({ userId: matches.userId })
      .from(matches)
      .where(and(
        eq(matches.projectId, projectId),
        eq(matches.status, 'accepted')
      ))
      .limit(1)

    return acceptedMatch ?? null
  }

  async findAcceptedMatchForUser(projectId: number, userId: number) {
    const [acceptedMatch] = await db
      .select({ projectId: matches.projectId })
      .from(matches)
      .where(and(
        eq(matches.projectId, projectId),
        eq(matches.userId, userId),
        eq(matches.status, 'accepted')
      ))
      .limit(1)

    return acceptedMatch ?? null
  }

  async findAnyAcceptedMatchAsInterestedUser(userId: number, client: any = db) {
    const [accepted] = await client
      .select({ projectId: matches.projectId })
      .from(matches)
      .where(and(
        eq(matches.userId, userId),
        eq(matches.status, 'accepted')
      ))
      .limit(1)

    return accepted ?? null
  }

  async findAnyAcceptedMatchAsOwner(userId: number, client: any = db) {
    const [accepted] = await client
      .select({ projectId: projects.id })
      .from(projects)
      .innerJoin(matches, eq(matches.projectId, projects.id))
      .where(and(
        eq(matches.status, 'accepted'),
        eq(projects.proposerId, userId)
      ))
      .limit(1)

    return accepted ?? null
  }

  async importAdminTags(tagList: Array<{ name: string }>) {
    let created = 0
    let skipped = 0
    const errors: string[] = []

    await db.transaction(async (trx) => {
      for (const [index, item] of tagList.entries()) {
        const normalizedName = item.name.trim()

        if (!normalizedName) {
          skipped += 1
          errors.push(`Fila ${index + 2}: nombre vacio`)
          continue
        }

        const [existing] = await trx
          .select({ id: tags.id })
          .from(tags)
          .where(eq(tags.name, normalizedName))
          .limit(1)

        if (existing) {
          skipped += 1
          continue
        }

        await trx.insert(tags).values({ name: normalizedName })
        created += 1
      }
    })

    return {
      message: 'Tag import completed',
      created,
      skipped,
      errors,
    }
  }
}
