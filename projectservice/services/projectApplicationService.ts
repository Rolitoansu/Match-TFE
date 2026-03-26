import axios from 'axios'
import db from '@match-tfe/db'
import { matches, projects, projectTags, tags, userTags, users } from '@match-tfe/db/schema'
import { and, desc, eq, inArray, isNotNull, ne, or } from 'drizzle-orm'

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notificationservice:5004'

export class HttpError extends Error {
    constructor(
        public readonly status: number,
        public readonly payload: Record<string, unknown>
    ) {
        super(String(payload.error ?? payload.message ?? 'Request failed'))
    }
}

type UserRole = 'student' | 'professor'

type CurrentUser = {
    id: number
    role: UserRole
}

type CreateProposalInput = {
    title: string
    description?: string
    type: number
    tags?: string[]
}

export class ProjectApplicationService {
    private async getAcceptedMatchContext(userId: number) {
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
                    studentId: projects.studentId,
                    tutorId: projects.tutorId,
                })
                .from(projects)
                .where(eq(projects.id, acceptedAsInterestedUser.projectId))
                .limit(1)

            if (!project) {
                return null
            }

            const counterpartUserId = project.studentId ?? project.tutorId

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
                or(
                    eq(projects.studentId, userId),
                    eq(projects.tutorId, userId)
                )
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

    private async sendNotification(userId: number, type: string, content: string) {
        if (process.env.NODE_ENV === 'test') {
            return
        }

        try {
            await axios.post(`${NOTIFICATION_SERVICE_URL}/users`, { userId, type, content })
        } catch (error) {
            console.warn('[projectservice] notification dispatch failed:', error)
        }
    }

    private async getUserWithRole(userEmail: string): Promise<CurrentUser | null> {
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

        return user as CurrentUser
    }

    private getOwner(project: { studentId: number | null; tutorId: number | null }) {
        if (project.studentId) {
            return { ownerId: project.studentId, ownerRole: 'student' as const }
        }

        if (project.tutorId) {
            return { ownerId: project.tutorId, ownerRole: 'professor' as const }
        }

        return { ownerId: null, ownerRole: null }
    }

    private async getProjectTagNames(projectId: number) {
        const proposalTags = await db
            .select({ name: tags.name })
            .from(tags)
            .innerJoin(projectTags, eq(projectTags.tagId, tags.id))
            .where(eq(projectTags.projectId, projectId))

        return proposalTags.map((tag) => tag.name)
    }

    private async getProjectTagIds(projectId: number) {
        const proposalTagIds = await db
            .select({ id: projectTags.tagId })
            .from(projectTags)
            .where(eq(projectTags.projectId, projectId))

        return proposalTagIds.map((tag) => tag.id)
    }

    async getProposals(userEmail: string) {
        const currentUser = await this.getUserWithRole(userEmail)

        if (!currentUser || !currentUser.id) {
            throw new HttpError(404, { error: 'Authenticated user not found or role not supported' })
        }

        const proposals = currentUser.role === 'student'
            ? await db
                .select({
                    id: projects.id,
                    title: projects.title,
                    description: projects.description,
                    type: projects.tfeType,
                    publicationDate: projects.publicationDate,
                    status: projects.status,
                    studentId: projects.studentId,
                    tutorId: projects.tutorId,
                    creatorName: users.name,
                    creatorSurname: users.surname,
                })
                .from(projects)
                .innerJoin(users, eq(users.id, projects.tutorId))
                .where(and(eq(users.role, 'professor'), isNotNull(projects.tutorId)))
                .orderBy(desc(projects.publicationDate))
                .limit(50)
            : await db
                .select({
                    id: projects.id,
                    title: projects.title,
                    description: projects.description,
                    type: projects.tfeType,
                    publicationDate: projects.publicationDate,
                    status: projects.status,
                    studentId: projects.studentId,
                    tutorId: projects.tutorId,
                    creatorName: users.name,
                    creatorSurname: users.surname,
                })
                .from(projects)
                .innerJoin(users, eq(users.id, projects.studentId))
                .where(and(eq(users.role, 'student'), isNotNull(projects.studentId)))
                .orderBy(desc(projects.publicationDate))
                .limit(50)

        const proposalsWithInterestedUsers = await Promise.all(proposals.map(async (proposal) => {
            const { ownerId } = this.getOwner(proposal)
            const isOwner = ownerId === currentUser.id

            const [proposalOwner] = ownerId
                ? await db
                    .select({ name: users.name, surname: users.surname })
                    .from(users)
                    .where(eq(users.id, ownerId))
                    .limit(1)
                : []

            const proposalMatches = await db
                .select({ userId: matches.userId, status: matches.status })
                .from(matches)
                .where(eq(matches.projectId, proposal.id))

            const interestedMatches = proposalMatches.filter(
                (match) => match.status === 'pending' || match.status === 'accepted'
            )

            const interestedUserIds = interestedMatches.map((match) => match.userId)
            const interestedPeople = interestedUserIds.length > 0
                ? await db
                    .select({ id: users.id, name: users.name, surname: users.surname, email: users.email })
                    .from(users)
                    .where(inArray(users.id, interestedUserIds))
                : []

            const interestedUsers = isOwner
                ? interestedMatches.map((match) => {
                    const person = interestedPeople.find((user) => user.id === match.userId)
                    return {
                        id: match.userId,
                        name: person?.name ?? 'Usuario',
                        surname: person?.surname ?? '',
                        email: match.status === 'accepted' ? (person?.email ?? null) : null,
                        matchStatus: match.status,
                        likedAt: null,
                    }
                })
                : []

            const likedByCurrentUser = interestedMatches.some((match) => match.userId === currentUser.id)
            const tagsForProposal = await this.getProjectTagNames(proposal.id)

            return {
                ...proposal,
                creatorName: proposalOwner?.name ?? proposal.creatorName ?? 'Usuario',
                creatorSurname: proposalOwner?.surname ?? proposal.creatorSurname ?? '',
                interestCount: interestedMatches.length,
                likedByCurrentUser,
                tags: tagsForProposal,
                interestedUsers,
            }
        }))

        return {
            proposals: proposalsWithInterestedUsers.map(({ studentId, tutorId, ...proposal }) => proposal),
        }
    }

    async getExplore(userEmail: string) {
        const currentUser = await this.getUserWithRole(userEmail)

        if (!currentUser) {
            throw new HttpError(404, { error: 'Authenticated user not found or role not supported' })
        }

        const acceptedMatchContext = await this.getAcceptedMatchContext(currentUser.id)

        if (acceptedMatchContext) {
            const tagsForMatchedProposal = await this.getProjectTagNames(acceptedMatchContext.project.id)

            return {
                viewerRole: currentUser.role,
                proposals: [],
                matchedProposal: {
                    id: acceptedMatchContext.project.id,
                    title: acceptedMatchContext.project.title,
                    description: acceptedMatchContext.project.description,
                    type: acceptedMatchContext.project.type,
                    publicationDate: acceptedMatchContext.project.publicationDate,
                    status: acceptedMatchContext.project.status,
                    tags: tagsForMatchedProposal,
                    counterpartId: acceptedMatchContext.counterpart.id,
                    counterpartName: acceptedMatchContext.counterpart.name,
                    counterpartSurname: acceptedMatchContext.counterpart.surname,
                    counterpartEmail: acceptedMatchContext.counterpart.email,
                },
            }
        }

        const currentUserInterestRows = await db
            .select({ tagId: userTags.tagId })
            .from(userTags)
            .where(eq(userTags.userId, currentUser.id))

        const currentUserInterestTagIds = new Set(currentUserInterestRows.map((row) => row.tagId))

        if (currentUserInterestTagIds.size === 0) {
            return { viewerRole: currentUser.role, proposals: [], matchedProposal: null }
        }

        const isStudent = currentUser.role === 'student'
        const rawProposals = await db
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
            })
            .from(projects)
            .innerJoin(
                users,
                isStudent
                    ? eq(users.id, projects.tutorId)
                    : eq(users.id, projects.studentId)
            )
            .where(and(
                eq(projects.status, 'proposed'),
                ne(users.id, currentUser.id),
                isStudent ? isNotNull(projects.tutorId) : isNotNull(projects.studentId)
            ))
            .orderBy(desc(projects.publicationDate))

        const proposals: Array<Record<string, unknown>> = []

        for (const proposal of rawProposals) {
            const [hasAcceptedMatch] = await db
                .select({ projectId: matches.projectId })
                .from(matches)
                .where(and(eq(matches.projectId, proposal.id), eq(matches.status, 'accepted')))
                .limit(1)

            if (hasAcceptedMatch) {
                continue
            }

            const proposalTagIds = await this.getProjectTagIds(proposal.id)
            const sharedTagsCount = proposalTagIds.filter((tagId) => currentUserInterestTagIds.has(tagId)).length

            if (sharedTagsCount === 0) {
                continue
            }

            const [existingMatch] = await db
                .select({ status: matches.status })
                .from(matches)
                .where(and(eq(matches.projectId, proposal.id), eq(matches.userId, currentUser.id)))
                .limit(1)

            if (existingMatch) {
                continue
            }

            proposals.push({
                ...proposal,
                liked: false,
                matchStatus: null,
                sharedTagsCount,
                tags: await this.getProjectTagNames(proposal.id),
            })
        }

        proposals.sort((a, b) => {
            const sharedA = Number(a.sharedTagsCount ?? 0)
            const sharedB = Number(b.sharedTagsCount ?? 0)

            if (sharedA !== sharedB) {
                return sharedB - sharedA
            }

            const dateA = new Date(String(a.publicationDate)).getTime()
            const dateB = new Date(String(b.publicationDate)).getTime()
            return dateB - dateA
        })

        return { viewerRole: currentUser.role, proposals, matchedProposal: null }
    }

    async getProposalById(userEmail: string, projectId: number) {
        const currentUser = await this.getUserWithRole(userEmail)

        if (!currentUser || !currentUser.id) {
            throw new HttpError(404, { error: 'Authenticated user not found or role not supported' })
        }

        const [proposal] = await db
            .select({
                id: projects.id,
                title: projects.title,
                description: projects.description,
                type: projects.tfeType,
                publicationDate: projects.publicationDate,
                status: projects.status,
                studentId: projects.studentId,
                tutorId: projects.tutorId,
            })
            .from(projects)
            .where(eq(projects.id, projectId))

        if (!proposal) {
            throw new HttpError(404, { error: 'Project proposal not found' })
        }

        const proposalTags = await db
            .select({ name: tags.name })
            .from(tags)
            .innerJoin(projectTags, eq(projectTags.tagId, tags.id))
            .where(eq(projectTags.projectId, projectId))

        const ownerId = proposal.studentId ?? proposal.tutorId

        const [proposalUser] = ownerId
            ? await db
                .select({ id: users.id, name: users.name, surname: users.surname, email: users.email })
                .from(users)
                .where(eq(users.id, ownerId))
                .limit(1)
            : []

        const isOwner = currentUser.role === 'student'
            ? proposal.studentId === currentUser.id
            : proposal.tutorId === currentUser.id

        const interestedRows = isOwner
            ? await db
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
            : []

        const [acceptedMatch] = await db
            .select({ projectId: matches.projectId })
            .from(matches)
            .where(and(
                eq(matches.projectId, projectId),
                eq(matches.userId, currentUser.id),
                eq(matches.status, 'accepted')
            ))
            .limit(1)

        const [viewerMatch] = await db
            .select({ status: matches.status })
            .from(matches)
            .where(and(
                eq(matches.projectId, projectId),
                eq(matches.userId, currentUser.id)
            ))
            .limit(1)

        const canSeeOwnerEmail = isOwner || Boolean(acceptedMatch)

        return {
            proposal: {
                ...proposal,
                isOwner,
                viewerMatchStatus: viewerMatch?.status ?? null,
                tags: proposalTags.map((tag) => tag.name),
                user: proposalUser
                    ? {
                        id: proposalUser.id,
                        name: proposalUser.name,
                        surname: proposalUser.surname,
                        email: canSeeOwnerEmail ? proposalUser.email : null,
                    }
                    : null,
                interestedUsers: isOwner
                    ? interestedRows.map((person) => ({
                        ...person,
                        email: person.matchStatus === 'accepted' ? person.email : null,
                        likedAt: null,
                    }))
                    : [],
            },
        }
    }

    async getTags() {
        const allTags = await db
            .select({ id: tags.id, name: tags.name })
            .from(tags)
            .orderBy(tags.name)

        return { tags: allTags }
    }

    async createProposal(userEmail: string, input: CreateProposalInput) {
        const [currentUser] = await db
            .select({ id: users.id, role: users.role })
            .from(users)
            .where(eq(users.email, userEmail))
            .limit(1)

        if (!currentUser || (currentUser.role !== 'student' && currentUser.role !== 'professor')) {
            throw new HttpError(404, { error: 'User not found' })
        }

        if (!input.tags || input.tags.length === 0) {
            throw new HttpError(400, { error: 'At least one tag is required' })
        }

        await db.transaction(async (trx) => {
            const [project] = await trx
                .insert(projects)
                .values(
                    currentUser.role === 'student'
                        ? { title: input.title, description: input.description, tfeType: input.type, studentId: currentUser.id }
                        : { title: input.title, description: input.description, tfeType: input.type, tutorId: currentUser.id }
                )
                .returning({ id: projects.id })

            const tagIds = await trx
                .select({ id: tags.id })
                .from(tags)
                .where(inArray(tags.name, input.tags))

            if (tagIds.length !== input.tags.length) {
                throw new HttpError(400, { error: 'One or more tags are not allowed' })
            }

            await trx
                .insert(projectTags)
                .values(tagIds.map((tag) => ({ projectId: project.id, tagId: tag.id })))
        })

        return { message: 'Project proposal created successfully' }
    }

    async renewProposal(userEmail: string, projectId: number) {
        const currentUser = await this.getUserWithRole(userEmail)

        if (!currentUser) {
            throw new HttpError(404, { error: 'Authenticated user not found or role not supported' })
        }

        const [proposal] = await db
            .select({ id: projects.id, status: projects.status, studentId: projects.studentId, tutorId: projects.tutorId })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1)

        if (!proposal) {
            throw new HttpError(404, { error: 'Proposal not found' })
        }

        const isOwner = currentUser.role === 'student'
            ? proposal.studentId === currentUser.id
            : proposal.tutorId === currentUser.id

        if (!isOwner) {
            throw new HttpError(403, { error: 'Only the owner can renew a proposal' })
        }

        if (proposal.status === 'completed') {
            throw new HttpError(409, { error: 'Completed proposals cannot be renewed' })
        }

        const renewedAt = new Date()
        const expiresAt = new Date(renewedAt)
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)

        await db
            .update(projects)
            .set({ publicationDate: renewedAt })
            .where(eq(projects.id, projectId))

        return { publicationDate: renewedAt, renewedAt, expiresAt }
    }

    async completeProposal(userEmail: string, projectId: number) {
        const currentUser = await this.getUserWithRole(userEmail)

        if (!currentUser) {
            throw new HttpError(404, { error: 'Authenticated user not found or role not supported' })
        }

        const [proposal] = await db
            .select({ id: projects.id, status: projects.status, studentId: projects.studentId, tutorId: projects.tutorId })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1)

        if (!proposal) {
            throw new HttpError(404, { error: 'Proposal not found' })
        }

        if (currentUser.role !== 'professor') {
            throw new HttpError(403, { error: 'Only professors can mark the proposal as completed' })
        }

        const isOwner = currentUser.role === 'student'
            ? proposal.studentId === currentUser.id
            : proposal.tutorId === currentUser.id

        if (proposal.status !== 'in_progress') {
            throw new HttpError(409, { error: 'Only proposals in progress can be completed' })
        }

        const [acceptedMatch] = await db
            .select({ userId: matches.userId })
            .from(matches)
            .where(and(
                eq(matches.projectId, projectId),
                eq(matches.status, 'accepted')
            ))
            .limit(1)

        if (!acceptedMatch) {
            throw new HttpError(409, { error: 'Proposal has no accepted match to complete' })
        }

        const isAcceptedProfessor = acceptedMatch.userId === currentUser.id

        if (!isOwner && !isAcceptedProfessor) {
            throw new HttpError(403, { error: 'Only a professor involved in the proposal can mark it as completed' })
        }

        await db.transaction(async (trx) => {
            await trx
                .update(projects)
                .set({ status: 'completed' })
                .where(eq(projects.id, projectId))

            await trx
                .delete(matches)
                .where(and(
                    eq(matches.projectId, projectId),
                    eq(matches.status, 'accepted')
                ))
        })

        return {
            completed: true,
            projectId,
            status: 'completed' as const,
        }
    }

    async cancelProposalExecution(userEmail: string, projectId: number) {
        const currentUser = await this.getUserWithRole(userEmail)

        if (!currentUser) {
            throw new HttpError(404, { error: 'Authenticated user not found or role not supported' })
        }

        const [proposal] = await db
            .select({ id: projects.id, status: projects.status, studentId: projects.studentId, tutorId: projects.tutorId })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1)

        if (!proposal) {
            throw new HttpError(404, { error: 'Proposal not found' })
        }

        if (proposal.status !== 'in_progress') {
            throw new HttpError(409, { error: 'Only proposals in progress can be cancelled' })
        }

        const [acceptedMatch] = await db
            .select({ userId: matches.userId })
            .from(matches)
            .where(and(
                eq(matches.projectId, projectId),
                eq(matches.status, 'accepted')
            ))
            .limit(1)

        if (!acceptedMatch) {
            throw new HttpError(409, { error: 'Proposal has no accepted match to cancel' })
        }

        const isOwner = currentUser.role === 'student'
            ? proposal.studentId === currentUser.id
            : proposal.tutorId === currentUser.id
        const isAcceptedUser = acceptedMatch.userId === currentUser.id

        if (!isOwner && !isAcceptedUser) {
            throw new HttpError(403, { error: 'Only the owner or matched user can cancel the proposal execution' })
        }

        await db.transaction(async (trx) => {
            await trx
                .update(projects)
                .set({ status: 'proposed' })
                .where(eq(projects.id, projectId))

            await trx
                .delete(matches)
                .where(and(
                    eq(matches.projectId, projectId),
                    eq(matches.userId, acceptedMatch.userId)
                ))
        })

        return {
            cancelled: true,
            projectId,
            status: 'proposed' as const,
        }
    }

    async likeProposal(userEmail: string, projectId: number) {
        const currentUser = await this.getUserWithRole(userEmail)

        if (!currentUser) {
            throw new HttpError(404, { error: 'Authenticated user not found or role not supported' })
        }

        const existingAcceptedMatch = await this.getAcceptedMatchContext(currentUser.id)

        if (existingAcceptedMatch) {
            throw new HttpError(409, { error: 'You already have an accepted match' })
        }

        const [proposal] = await db
            .select({
                id: projects.id,
                studentId: projects.studentId,
                tutorId: projects.tutorId,
                status: projects.status,
            })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1)

        if (!proposal || proposal.status !== 'proposed') {
            throw new HttpError(404, { error: 'Proposal not available for likes' })
        }

        const { ownerId, ownerRole } = this.getOwner(proposal)

        if (!ownerId || !ownerRole) {
            throw new HttpError(400, { error: 'Proposal owner not found' })
        }

        if (ownerId === currentUser.id) {
            throw new HttpError(400, { error: 'You cannot like your own proposal' })
        }

        if (ownerRole === currentUser.role) {
            throw new HttpError(400, { error: 'Only proposals from the opposite role can be liked' })
        }

        await db.transaction(async (trx) => {
            const [alreadyAccepted] = await trx
                .select({ projectId: matches.projectId })
                .from(matches)
                .where(and(
                    eq(matches.projectId, projectId),
                    eq(matches.status, 'accepted')
                ))
                .limit(1)

            if (alreadyAccepted) {
                throw new HttpError(409, { error: 'This proposal already has an accepted match' })
            }

            const [existingInteraction] = await trx
                .select({ status: matches.status })
                .from(matches)
                .where(and(eq(matches.projectId, projectId), eq(matches.userId, currentUser.id)))
                .limit(1)

            if (!existingInteraction) {
                await trx
                    .insert(matches)
                    .values({
                        projectId,
                        userId: currentUser.id,
                        status: 'pending',
                    })
            } else if (existingInteraction.status !== 'accepted') {
                await trx
                    .update(matches)
                    .set({ status: 'pending' })
                    .where(and(eq(matches.projectId, projectId), eq(matches.userId, currentUser.id)))
            }
        })

        const [updatedInteraction] = await db
            .select({ status: matches.status })
            .from(matches)
            .where(and(eq(matches.projectId, projectId), eq(matches.userId, currentUser.id)))
            .limit(1)

        return {
            liked: true,
            matchStatus: updatedInteraction?.status ?? 'pending',
            matched: false,
        }
    }

    async acceptProposalMatch(userEmail: string, projectId: number, interestedUserId: number) {
        const currentUser = await this.getUserWithRole(userEmail)

        if (!currentUser) {
            throw new HttpError(404, { error: 'Authenticated user not found or role not supported' })
        }

        const [proposal] = await db
            .select({
                id: projects.id,
                title: projects.title,
                status: projects.status,
                studentId: projects.studentId,
                tutorId: projects.tutorId,
            })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1)

        if (!proposal) {
            throw new HttpError(404, { error: 'Proposal not found' })
        }

        const isOwner = currentUser.role === 'student'
            ? proposal.studentId === currentUser.id
            : proposal.tutorId === currentUser.id

        if (!isOwner) {
            throw new HttpError(403, { error: 'Only the owner can accept a match' })
        }

        if (proposal.status !== 'proposed') {
            throw new HttpError(409, { error: 'Proposal is not available for new matches' })
        }

        await db.transaction(async (trx) => {
            const [ownerAcceptedAsInterestedUser] = await trx
                .select({ projectId: matches.projectId })
                .from(matches)
                .where(and(
                    eq(matches.userId, currentUser.id),
                    eq(matches.status, 'accepted')
                ))
                .limit(1)

            const [ownerAcceptedAsOwner] = await trx
                .select({ projectId: projects.id })
                .from(projects)
                .innerJoin(matches, eq(matches.projectId, projects.id))
                .where(and(
                    eq(matches.status, 'accepted'),
                    or(
                        eq(projects.studentId, currentUser.id),
                        eq(projects.tutorId, currentUser.id)
                    )
                ))
                .limit(1)

            if (ownerAcceptedAsInterestedUser || ownerAcceptedAsOwner) {
                throw new HttpError(409, { error: 'You already have an accepted match' })
            }

            const [candidateAcceptedAsInterestedUser] = await trx
                .select({ projectId: matches.projectId })
                .from(matches)
                .where(and(
                    eq(matches.userId, interestedUserId),
                    eq(matches.status, 'accepted')
                ))
                .limit(1)

            const [candidateAcceptedAsOwner] = await trx
                .select({ projectId: projects.id })
                .from(projects)
                .innerJoin(matches, eq(matches.projectId, projects.id))
                .where(and(
                    eq(matches.status, 'accepted'),
                    or(
                        eq(projects.studentId, interestedUserId),
                        eq(projects.tutorId, interestedUserId)
                    )
                ))
                .limit(1)

            if (candidateAcceptedAsInterestedUser || candidateAcceptedAsOwner) {
                throw new HttpError(409, { error: 'Selected user already has an accepted match' })
            }

            const [alreadyAccepted] = await trx
                .select({ userId: matches.userId })
                .from(matches)
                .where(and(
                    eq(matches.projectId, projectId),
                    eq(matches.status, 'accepted')
                ))
                .limit(1)

            if (alreadyAccepted) {
                throw new HttpError(409, { error: 'This proposal already has an accepted match' })
            }

            const [candidateLike] = await trx
                .select({ userId: matches.userId })
                .from(matches)
                .where(and(
                    eq(matches.projectId, projectId),
                    eq(matches.userId, interestedUserId),
                    eq(matches.status, 'pending')
                ))
                .limit(1)

            if (!candidateLike) {
                throw new HttpError(404, { error: 'Pending like not found for this user' })
            }

            await trx
                .update(matches)
                .set({ status: 'rejected' })
                .where(and(
                    eq(matches.projectId, projectId),
                    eq(matches.status, 'pending')
                ))

            await trx
                .update(matches)
                .set({ status: 'accepted' })
                .where(and(
                    eq(matches.projectId, projectId),
                    eq(matches.userId, interestedUserId)
                ))

            await trx
                .update(projects)
                .set({ status: 'in_progress' })
                .where(eq(projects.id, projectId))
        })

        await this.sendNotification(
            interestedUserId,
            'match_available',
            `Tienes un match disponible en la propuesta "${proposal.title}".`
        )

        return {
            accepted: true,
            projectId,
            userId: interestedUserId,
        }
    }

    async passProposal(userEmail: string, projectId: number) {
        const currentUser = await this.getUserWithRole(userEmail)

        if (!currentUser) {
            throw new HttpError(404, { error: 'Authenticated user not found or role not supported' })
        }

        const [proposal] = await db
            .select({ id: projects.id, studentId: projects.studentId, tutorId: projects.tutorId, status: projects.status })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1)

        if (!proposal || proposal.status !== 'proposed') {
            throw new HttpError(404, { error: 'Proposal not available' })
        }

        const { ownerId, ownerRole } = this.getOwner(proposal)
        const isValidDirection = Boolean(ownerId && ownerRole && ownerRole !== currentUser.role)

        if (!isValidDirection) {
            throw new HttpError(400, { error: 'This proposal is not from the opposite role' })
        }

        await db.transaction(async (trx) => {
            const [existingInteraction] = await trx
                .select({ status: matches.status })
                .from(matches)
                .where(and(eq(matches.projectId, projectId), eq(matches.userId, currentUser.id)))
                .limit(1)

            if (!existingInteraction) {
                await trx
                    .insert(matches)
                    .values({ projectId, userId: currentUser.id, status: 'rejected' })
            } else {
                await trx
                    .update(matches)
                    .set({ status: 'rejected' })
                    .where(and(eq(matches.projectId, projectId), eq(matches.userId, currentUser.id)))
            }
        })

        return { passed: true }
    }

    async listAdminTags() {
        const allTags = await db.select().from(tags).orderBy(tags.name)
        return { tags: allTags }
    }

    async createAdminTag(name: string) {
        const normalizedName = name.trim()

        if (!normalizedName) {
            throw new HttpError(400, { error: 'Tag name is required' })
        }

        const [existing] = await db
            .select()
            .from(tags)
            .where(eq(tags.name, normalizedName))
            .limit(1)

        if (existing) {
            throw new HttpError(409, { error: 'Tag already exists' })
        }

        const [tag] = await db
            .insert(tags)
            .values({ name: normalizedName })
            .returning({ id: tags.id, name: tags.name })

        return { tag }
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

    async deleteAdminTag(tagId: number) {
        const [deleted] = await db
            .delete(tags)
            .where(eq(tags.id, tagId))
            .returning({ id: tags.id })

        if (!deleted) {
            throw new HttpError(404, { error: 'Tag not found' })
        }

        return { message: 'Tag deleted' }
    }

    async updateAdminTag(tagId: number, name: string) {
        const normalizedName = name.trim()

        if (!normalizedName) {
            throw new HttpError(400, { error: 'Tag name cannot be empty' })
        }

        const [existing] = await db
            .select({ id: tags.id })
            .from(tags)
            .where(eq(tags.name, normalizedName))
            .limit(1)

        if (existing && existing.id !== tagId) {
            throw new HttpError(409, { error: 'A tag with this name already exists' })
        }

        const [updated] = await db
            .update(tags)
            .set({ name: normalizedName })
            .where(eq(tags.id, tagId))
            .returning({ id: tags.id, name: tags.name })

        if (!updated) {
            throw new HttpError(404, { error: 'Tag not found' })
        }

        return { tag: updated }
    }
}
