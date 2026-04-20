import axios from 'axios'
import { ProjectRepository } from '../repositories/projectRepository'

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
    private readonly projectRepository = new ProjectRepository()

    private async getAcceptedMatchContext(userId: number) {
        return this.projectRepository.getAcceptedMatchContext(userId)
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
        return this.projectRepository.getCurrentUserByEmail(userEmail)
    }

    private getOwnerId(project: Record<string, unknown>) {
        const proposerId = project.proposerId as number | null | undefined
        const studentId = project.studentId as number | null | undefined
        const tutorId = project.tutorId as number | null | undefined

        return proposerId ?? tutorId ?? studentId ?? null
    }

    private getOwnerRole(project: Record<string, unknown>): UserRole | null {
        const studentId = project.studentId as number | null | undefined
        const tutorId = project.tutorId as number | null | undefined

        if (studentId) {
            return 'student'
        }

        if (tutorId) {
            return 'professor'
        }

        return null
    }

    private isOwner(project: Record<string, unknown>, currentUser: CurrentUser) {
        const proposerId = project.proposerId as number | null | undefined

        if (proposerId !== undefined && proposerId !== null) {
            return proposerId === currentUser.id
        }

        const studentId = project.studentId as number | null | undefined
        const tutorId = project.tutorId as number | null | undefined

        if (currentUser.role === 'student') {
            return studentId === currentUser.id
        }

        return tutorId === currentUser.id
    }

    private async getProjectTagNames(projectId: number) {
        return this.projectRepository.getProjectTagNames(projectId)
    }

    private async getProjectTagIds(projectId: number) {
        return this.projectRepository.getProjectTagIds(projectId)
    }

    async getProposals(userEmail: string) {
        const currentUser = await this.getUserWithRole(userEmail)

        if (!currentUser || !currentUser.id) {
            throw new HttpError(404, { error: 'Authenticated user not found or role not supported' })
        }

        const proposals = await this.projectRepository.getProposalListByRole(currentUser.role, currentUser.id)

        const proposalsWithInterestedUsers = await Promise.all(proposals.map(async (proposal) => {
            const ownerId = this.getOwnerId(proposal as Record<string, unknown>)
            const isOwner = ownerId === currentUser.id

            const proposalOwner = ownerId
                ? await this.projectRepository.getProjectOwnerById(ownerId)
                : null

            const proposalMatches = await this.projectRepository.getProjectMatches(proposal.id)


            const interestedMatches = proposalMatches.filter(
                (match: { userId: number; status: 'pending' | 'accepted' | 'rejected' }) => match.status === 'pending' || match.status === 'accepted'
            )

            const interestedUserIds = interestedMatches.map((match: { userId: number }) => match.userId)
            const interestedPeople = interestedUserIds.length > 0
                ? await this.projectRepository.getUsersByIds(interestedUserIds)
                : []

            const interestedUsers = isOwner
                ? interestedMatches.map((match: { userId: number; status: 'pending' | 'accepted' | 'rejected' }) => {
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

            const likedByCurrentUser = interestedMatches.some((match: { userId: number }) => match.userId === currentUser.id)
            
                // Check if current user has rejected/passed this proposal
                const userRejection = proposalMatches.find(
                    (match: { userId: number; status: 'pending' | 'accepted' | 'rejected' }) => match.userId === currentUser.id && match.status === 'rejected'
                )
                const passedByCurrentUser = !!userRejection

            const tagsForProposal = await this.getProjectTagNames(proposal.id)

            return {
                ...proposal,
                creatorName: proposalOwner?.name ?? proposal.creatorName ?? 'Usuario',
                creatorSurname: proposalOwner?.surname ?? proposal.creatorSurname ?? '',
                interestCount: interestedMatches.length,
                likedByCurrentUser,
                    passedByCurrentUser,
                tags: tagsForProposal,
                interestedUsers,
            }
        }))

        return {
                proposals: proposalsWithInterestedUsers.map(({ proposerId, ...proposal }) => proposal),
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

        const currentUserInterestTagIds = await this.projectRepository.getCurrentUserInterests(currentUser.id)

        if (currentUserInterestTagIds.size === 0) {
            return { viewerRole: currentUser.role, proposals: [], matchedProposal: null }
        }

        const rawProposals = await this.projectRepository.getRawProposals(currentUser.role, currentUser.id)

        const proposals: Array<Record<string, unknown>> = []

        for (const proposal of rawProposals) {
            const hasAcceptedMatch = await this.projectRepository.findAcceptedMatchByProjectId(proposal.id)

            if (hasAcceptedMatch) {
                continue
            }

            const proposalTagIds = await this.getProjectTagIds(proposal.id)
            const sharedTagsCount = proposalTagIds.filter((tagId) => currentUserInterestTagIds.has(tagId)).length

            if (sharedTagsCount === 0) {
                continue
            }

            const existingMatch = await this.projectRepository.findExistingMatch(proposal.id, currentUser.id)

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

        const proposal = await this.projectRepository.findProjectById(projectId)

        if (!proposal) {
            throw new HttpError(404, { error: 'Project proposal not found' })
        }

        const proposalTags = await this.projectRepository.getProjectTagNames(projectId)

        const ownerId = this.getOwnerId(proposal as Record<string, unknown>)

        const proposalUser = ownerId
            ? await this.projectRepository.getProjectOwnerById(ownerId)
            : null

        const isOwner = ownerId === currentUser.id

        const interestedRows = isOwner
            ? await this.projectRepository.getInterestedUsers(projectId)
            : []

        const acceptedMatch = await this.projectRepository.findAcceptedMatchForUser(projectId, currentUser.id)

        const viewerMatch = await this.projectRepository.findExistingMatch(projectId, currentUser.id)

        const canSeeOwnerEmail = isOwner || Boolean(acceptedMatch)

        return {
            proposal: {
                ...proposal,
                isOwner,
                viewerMatchStatus: viewerMatch?.status ?? null,
                tags: proposalTags,
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
        const allTags = await this.projectRepository.getTags()

        return { tags: allTags }
    }

    async createProposal(userEmail: string, input: CreateProposalInput) {
        const currentUser = await this.projectRepository.getCurrentUserByEmail(userEmail)

        if (!currentUser || (currentUser.role !== 'student' && currentUser.role !== 'professor')) {
            throw new HttpError(404, { error: 'User not found' })
        }

        if (!input.tags || input.tags.length === 0) {
            throw new HttpError(400, { error: 'At least one tag is required' })
        }

        const inputTags = input.tags

        await this.projectRepository.transaction(async (trx) => {
            const project = await this.projectRepository.createProposal(currentUser.role, currentUser.id, input, trx)
            const tagIds = await this.projectRepository.findTagsByNames(inputTags, trx)

            if (tagIds.length !== inputTags.length) {
                throw new HttpError(400, { error: 'One or more tags are not allowed' })
            }

            await this.projectRepository.createProjectTags(project!.id, tagIds.map((tag: { id: number }) => tag.id), trx)
        })

        return { message: 'Project proposal created successfully' }
    }

    async renewProposal(userEmail: string, projectId: number) {
        const currentUser = await this.getUserWithRole(userEmail)

        if (!currentUser) {
            throw new HttpError(404, { error: 'Authenticated user not found or role not supported' })
        }

        const proposal = await this.projectRepository.findProjectById(projectId)

        if (!proposal) {
            throw new HttpError(404, { error: 'Proposal not found' })
        }

        const isOwner = this.isOwner(proposal as Record<string, unknown>, currentUser)

        if (!isOwner) {
            throw new HttpError(403, { error: 'Only the owner can renew a proposal' })
        }

        if (proposal.status === 'completed') {
            throw new HttpError(409, { error: 'Completed proposals cannot be renewed' })
        }

        const renewedAt = new Date()
        const expiresAt = new Date(renewedAt)
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)

        await this.projectRepository.updateProjectPublicationDate(projectId, renewedAt)

        return { publicationDate: renewedAt, renewedAt, expiresAt }
    }

    async completeProposal(userEmail: string, projectId: number) {
        const currentUser = await this.getUserWithRole(userEmail)

        if (!currentUser) {
            throw new HttpError(404, { error: 'Authenticated user not found or role not supported' })
        }

        const proposal = await this.projectRepository.findProjectById(projectId)

        if (!proposal) {
            throw new HttpError(404, { error: 'Proposal not found' })
        }

        if (currentUser.role !== 'professor') {
            throw new HttpError(403, { error: 'Only professors can mark the proposal as completed' })
        }

        const isOwner = this.isOwner(proposal as Record<string, unknown>, currentUser)

        if (proposal.status !== 'in_progress') {
            throw new HttpError(409, { error: 'Only proposals in progress can be completed' })
        }

        const acceptedMatch = await this.projectRepository.findAcceptedMatchUserId(projectId)

        if (!acceptedMatch) {
            throw new HttpError(409, { error: 'Proposal has no accepted match to complete' })
        }

        const isAcceptedProfessor = acceptedMatch.userId === currentUser.id

        if (!isOwner && !isAcceptedProfessor) {
            throw new HttpError(403, { error: 'Only a professor involved in the proposal can mark it as completed' })
        }

        await this.projectRepository.transaction(async (trx) => {
            await this.projectRepository.updateProjectStatusInTransaction(projectId, 'completed', trx)

            await this.projectRepository.deleteAcceptedMatch(projectId, undefined, trx)
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

        const proposal = await this.projectRepository.findProjectById(projectId)

        if (!proposal) {
            throw new HttpError(404, { error: 'Proposal not found' })
        }

        if (proposal.status !== 'in_progress') {
            throw new HttpError(409, { error: 'Only proposals in progress can be cancelled' })
        }

        const acceptedMatch = await this.projectRepository.findAcceptedMatchUserId(projectId)

        if (!acceptedMatch) {
            throw new HttpError(409, { error: 'Proposal has no accepted match to cancel' })
        }

        const isOwner = this.isOwner(proposal as Record<string, unknown>, currentUser)
        const isAcceptedUser = acceptedMatch.userId === currentUser.id

        if (!isOwner && !isAcceptedUser) {
            throw new HttpError(403, { error: 'Only the owner or matched user can cancel the proposal execution' })
        }

        await this.projectRepository.transaction(async (trx) => {
            await this.projectRepository.updateProjectStatusInTransaction(projectId, 'proposed', trx)

            await this.projectRepository.deleteAcceptedMatch(projectId, acceptedMatch.userId, trx)
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

        const proposal = await this.projectRepository.findProjectById(projectId)

        if (!proposal || proposal.status !== 'proposed') {
            throw new HttpError(404, { error: 'Proposal not available for likes' })
        }

        const ownerId = this.getOwnerId(proposal as Record<string, unknown>)
        const hasCanonicalProposer = (proposal as { proposerId?: number | null }).proposerId !== undefined
        const owner = ownerId && hasCanonicalProposer ? await this.projectRepository.getProjectOwnerById(ownerId) : null
        const ownerRole = (owner?.role as UserRole | undefined) ?? this.getOwnerRole(proposal as Record<string, unknown>) ?? undefined

        if (!ownerId || !ownerRole) {
            throw new HttpError(400, { error: 'Proposal owner not found' })
        }

        if (ownerId === currentUser.id) {
            throw new HttpError(400, { error: 'You cannot like your own proposal' })
        }

        if (ownerRole === currentUser.role) {
            throw new HttpError(400, { error: 'Only proposals from the opposite role can be liked' })
        }

        await this.projectRepository.transaction(async (trx) => {
            const alreadyAccepted = await this.projectRepository.findAcceptedMatchByProjectId(projectId, trx)

            if (alreadyAccepted) {
                throw new HttpError(409, { error: 'This proposal already has an accepted match' })
            }

            const existingInteraction = await this.projectRepository.findExistingMatch(projectId, currentUser.id, trx)

            if (!existingInteraction) {
                await this.projectRepository.insertMatch(projectId, currentUser.id, 'pending', trx)
            } else if (existingInteraction.status !== 'accepted') {
                await this.projectRepository.updateMatchStatus(projectId, currentUser.id, 'pending', trx)
            }
        })

        const updatedInteraction = await this.projectRepository.findExistingMatch(projectId, currentUser.id)

        return {
            liked: true,
            matchStatus: updatedInteraction?.status ?? 'pending',
            matched: false,
        }
    }

    async toggleProposalLike(userEmail: string, projectId: number) {
        const currentUser = await this.getUserWithRole(userEmail)

        if (!currentUser) {
            throw new HttpError(404, { error: 'Authenticated user not found or role not supported' })
        }

        const existingInteraction = await this.projectRepository.findExistingMatch(projectId, currentUser.id)

        if (existingInteraction?.status === 'accepted') {
            throw new HttpError(409, { error: 'Cannot remove an accepted match' })
        }

        if (existingInteraction?.status === 'pending') {
            await this.projectRepository.deleteMatch(projectId, currentUser.id)

            return {
                liked: false,
                matchStatus: null,
                matched: false,
            }
        }

        return this.likeProposal(userEmail, projectId)
    }

    async acceptProposalMatch(userEmail: string, projectId: number, interestedUserId: number) {
        const currentUser = await this.getUserWithRole(userEmail)

        if (!currentUser) {
            throw new HttpError(404, { error: 'Authenticated user not found or role not supported' })
        }

        const proposal = await this.projectRepository.findProjectById(projectId)

        if (!proposal) {
            throw new HttpError(404, { error: 'Proposal not found' })
        }

        const isOwner = this.isOwner(proposal as Record<string, unknown>, currentUser)

        if (!isOwner) {
            throw new HttpError(403, { error: 'Only the owner can accept a match' })
        }

        if (proposal.status !== 'proposed') {
            throw new HttpError(409, { error: 'Proposal is not available for new matches' })
        }

        await this.projectRepository.transaction(async (trx) => {
            const ownerAcceptedAsInterestedUser = await this.projectRepository.findAnyAcceptedMatchAsInterestedUser(currentUser.id, trx)
            const ownerAcceptedAsOwner = await this.projectRepository.findAnyAcceptedMatchAsOwner(currentUser.id, trx)

            if (ownerAcceptedAsInterestedUser || ownerAcceptedAsOwner) {
                throw new HttpError(409, { error: 'You already have an accepted match' })
            }

            const candidateAcceptedAsInterestedUser = await this.projectRepository.findAnyAcceptedMatchAsInterestedUser(interestedUserId, trx)
            const candidateAcceptedAsOwner = await this.projectRepository.findAnyAcceptedMatchAsOwner(interestedUserId, trx)

            if (candidateAcceptedAsInterestedUser || candidateAcceptedAsOwner) {
                throw new HttpError(409, { error: 'Selected user already has an accepted match' })
            }

            const alreadyAccepted = await this.projectRepository.findAcceptedMatchUserId(projectId, trx)

            if (alreadyAccepted) {
                throw new HttpError(409, { error: 'This proposal already has an accepted match' })
            }

            const candidateLike = await this.projectRepository.findPendingMatch(projectId, interestedUserId, trx)

            if (!candidateLike) {
                throw new HttpError(404, { error: 'Pending like not found for this user' })
            }

            await this.projectRepository.rejectPendingMatchesForProject(projectId, trx)

            await this.projectRepository.updateMatchStatus(projectId, interestedUserId, 'accepted', trx)
            await this.projectRepository.updateProjectStatusInTransaction(projectId, 'in_progress', trx)
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

        const proposal = await this.projectRepository.findProjectById(projectId)

        if (!proposal || proposal.status !== 'proposed') {
            throw new HttpError(404, { error: 'Proposal not available' })
        }

        const ownerId = this.getOwnerId(proposal as Record<string, unknown>)
        const hasCanonicalProposer = (proposal as { proposerId?: number | null }).proposerId !== undefined
        const owner = ownerId && hasCanonicalProposer ? await this.projectRepository.getProjectOwnerById(ownerId) : null
        const ownerRole = (owner?.role as UserRole | undefined) ?? this.getOwnerRole(proposal as Record<string, unknown>) ?? undefined
        const isValidDirection = Boolean(ownerId && ownerRole && ownerRole !== currentUser.role)

        if (!isValidDirection) {
            throw new HttpError(400, { error: 'This proposal is not from the opposite role' })
        }

        const existingInteraction = await this.projectRepository.findExistingMatch(projectId, currentUser.id)

        if (existingInteraction?.status === 'accepted') {
            throw new HttpError(409, { error: 'Cannot remove an accepted match' })
        }

        await this.projectRepository.transaction(async (trx) => {
            if (existingInteraction?.status === 'rejected') {
                await this.projectRepository.deleteMatch(projectId, currentUser.id, trx)
                return
            }

            if (!existingInteraction) {
                await this.projectRepository.insertMatch(projectId, currentUser.id, 'rejected', trx)
                return
            }

            await this.projectRepository.updateMatchStatus(projectId, currentUser.id, 'rejected', trx)
        })

        return { passed: !existingInteraction || existingInteraction.status !== 'rejected' }
    }

    async listAdminTags() {
        const allTags = await this.projectRepository.getTags()
        return { tags: allTags }
    }

    async createAdminTag(name: string) {
        const normalizedName = name.trim()

        if (!normalizedName) {
            throw new HttpError(400, { error: 'Tag name is required' })
        }

        const existing = await this.projectRepository.findTagByName(normalizedName)

        if (existing) {
            throw new HttpError(409, { error: 'Tag already exists' })
        }

        const tag = await this.projectRepository.createTag(normalizedName)

        return { tag }
    }

    async importAdminTags(tagList: Array<{ name: string }>) {
        return this.projectRepository.importAdminTags(tagList)
    }

    async deleteAdminTag(tagId: number) {
        const deleted = await this.projectRepository.deleteTag(tagId)

        if (!deleted || deleted.length === 0) {
            throw new HttpError(404, { error: 'Tag not found' })
        }

        return { message: 'Tag deleted' }
    }

    async updateAdminTag(tagId: number, name: string) {
        const normalizedName = name.trim()

        if (!normalizedName) {
            throw new HttpError(400, { error: 'Tag name cannot be empty' })
        }

        const existing = await this.projectRepository.findTagByName(normalizedName)

        if (existing && existing.id !== tagId) {
            throw new HttpError(409, { error: 'A tag with this name already exists' })
        }

        const [updated] = await this.projectRepository.updateTag(tagId, normalizedName)

        if (!updated) {
            throw new HttpError(404, { error: 'Tag not found' })
        }

        return { tag: updated }
    }
}
