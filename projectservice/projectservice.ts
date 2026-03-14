import express from 'express'
import db from '@match-tfe/db'
import { users, projects, tags, projectTags, matches, proposalPasses, userTags } from '@match-tfe/db/schema'
import validate, { AdminTagImportSchema, GetTFESchema, TFECreationSchema } from './validate'
import { and, desc, eq, inArray, isNotNull, ne } from 'drizzle-orm'

const PORT = process.env.PORT || 5002

const app = express()
app.use(express.json())

type UserRole = 'student' | 'professor'

async function getUserWithRole(userEmail: string) {
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

    return user as { id: number; role: UserRole }
}

function getOwner(project: { studentId: number | null; tutorId: number | null }) {
    if (project.studentId) {
        return { ownerId: project.studentId, ownerRole: 'student' as const }
    }

    if (project.tutorId) {
        return { ownerId: project.tutorId, ownerRole: 'professor' as const }
    }

    return { ownerId: null, ownerRole: null }
}

async function getProjectTagNames(projectId: number) {
    const proposalTags = await db
        .select({ name: tags.name })
        .from(tags)
        .innerJoin(projectTags, eq(projectTags.tagId, tags.id))
        .where(eq(projectTags.projectId, projectId))

    return proposalTags.map((tag) => tag.name)
}

async function getProjectTagIds(projectId: number) {
    const proposalTagIds = await db
        .select({ id: projectTags.tagId })
        .from(projectTags)
        .where(eq(projectTags.projectId, projectId))

    return proposalTagIds.map((tag) => tag.id)
}

app.get('/proposals', async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    try {
        const currentUser = await getUserWithRole(userEmail)

        if (!currentUser || !currentUser.id) {
            return res.status(404).json({ error: 'Authenticated user not found or role not supported' })
        }

        const proposals = currentUser.role === 'student'
            ? await db
                .select({
                    id: projects.id,
                    title: projects.title,
                    description: projects.description,
                    publicationDate: projects.publicationDate,
                    status: projects.status,
                    studentId: projects.studentId,
                    tutorId: projects.tutorId,
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
                    publicationDate: projects.publicationDate,
                    status: projects.status,
                    studentId: projects.studentId,
                    tutorId: projects.tutorId,
                })
                .from(projects)
                .innerJoin(users, eq(users.id, projects.studentId))
                .where(and(eq(users.role, 'student'), isNotNull(projects.studentId)))
                .orderBy(desc(projects.publicationDate))
                .limit(50)

        const proposalsWithInterestedUsers = await Promise.all(proposals.map(async (proposal) => {
            const { ownerId } = getOwner(proposal)
            const isOwner = ownerId === currentUser.id

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
            const tagsForProposal = await getProjectTagNames(proposal.id)

            return {
                ...proposal,
                interestCount: interestedMatches.length,
                likedByCurrentUser,
                tags: tagsForProposal,
                interestedUsers,
            }
        }))

        return res.json({
            proposals: proposalsWithInterestedUsers.map(({ studentId, tutorId, ...proposal }) => proposal)
        })
        
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error fetching project proposals' })
    }
})

app.get('/explore', async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    try {
        const currentUser = await getUserWithRole(userEmail)

        if (!currentUser) {
            return res.status(404).json({ error: 'Authenticated user not found or role not supported' })
        }

        const currentUserInterestRows = await db
            .select({ tagId: userTags.tagId })
            .from(userTags)
            .where(eq(userTags.userId, currentUser.id))

        const currentUserInterestTagIds = new Set(currentUserInterestRows.map((row) => row.tagId))

        if (currentUserInterestTagIds.size === 0) {
            return res.json({ viewerRole: currentUser.role, proposals: [] })
        }

        if (currentUser.role === 'student') {
            const rawProposals = await db
                .select({
                    id: projects.id,
                    title: projects.title,
                    description: projects.description,
                    publicationDate: projects.publicationDate,
                    status: projects.status,
                    creatorId: users.id,
                    creatorName: users.name,
                    creatorSurname: users.surname,
                    creatorBiography: users.biography,
                })
                .from(projects)
                .innerJoin(users, eq(users.id, projects.tutorId))
                .where(and(
                    eq(projects.status, 'proposed'),
                    eq(users.role, 'professor'),
                    ne(users.id, currentUser.id),
                    isNotNull(projects.tutorId)
                ))
                .orderBy(desc(projects.publicationDate))

            const proposals = []

            for (const proposal of rawProposals) {
                const proposalTagIds = await getProjectTagIds(proposal.id)
                const hasSharedInterests = proposalTagIds.some((tagId) => currentUserInterestTagIds.has(tagId))

                if (!hasSharedInterests) {
                    continue
                }

                const [existingMatch] = await db
                    .select({ status: matches.status })
                    .from(matches)
                    .where(and(eq(matches.projectId, proposal.id), eq(matches.userId, currentUser.id)))
                    .limit(1)

                const [existingPass] = await db
                    .select({ proposalId: proposalPasses.proposalId })
                    .from(proposalPasses)
                    .where(and(eq(proposalPasses.proposalId, proposal.id), eq(proposalPasses.userId, currentUser.id)))
                    .limit(1)

                if (existingMatch || existingPass) {
                    continue
                }

                proposals.push({
                    ...proposal,
                    liked: false,
                    matchStatus: null,
                    tags: await getProjectTagNames(proposal.id),
                })
            }

            return res.json({ viewerRole: currentUser.role, proposals })
        }

        const rawProposals = await db
            .select({
                id: projects.id,
                title: projects.title,
                description: projects.description,
                publicationDate: projects.publicationDate,
                status: projects.status,
                creatorId: users.id,
                creatorName: users.name,
                creatorSurname: users.surname,
                creatorBiography: users.biography,
            })
            .from(projects)
            .innerJoin(users, eq(users.id, projects.studentId))
            .where(and(
                eq(projects.status, 'proposed'),
                eq(users.role, 'student'),
                ne(users.id, currentUser.id),
                isNotNull(projects.studentId)
            ))
            .orderBy(desc(projects.publicationDate))

        const proposals = []

        for (const proposal of rawProposals) {
            const proposalTagIds = await getProjectTagIds(proposal.id)
            const hasSharedInterests = proposalTagIds.some((tagId) => currentUserInterestTagIds.has(tagId))

            if (!hasSharedInterests) {
                continue
            }

            const [existingMatch] = await db
                .select({ status: matches.status })
                .from(matches)
                .where(and(eq(matches.projectId, proposal.id), eq(matches.userId, currentUser.id)))
                .limit(1)

            const [existingPass] = await db
                .select({ proposalId: proposalPasses.proposalId })
                .from(proposalPasses)
                .where(and(eq(proposalPasses.proposalId, proposal.id), eq(proposalPasses.userId, currentUser.id)))
                .limit(1)

            if (existingMatch || existingPass) {
                continue
            }

            proposals.push({
                ...proposal,
                liked: false,
                matchStatus: null,
                tags: await getProjectTagNames(proposal.id),
            })
        }

        return res.json({ viewerRole: currentUser.role, proposals })
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error fetching explore proposals' })
    }
})

app.get('/proposals/:id', validate(GetTFESchema, 'params'), async (req, res) => {
    const projectId = Number(req.params.id)
    const userEmail = req.headers['x-user-email'] as string

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    try {
        const currentUser = await getUserWithRole(userEmail)

        if (!currentUser || !currentUser.id) {
            return res.status(404).json({ error: 'Authenticated user not found or role not supported' })
        }

        const [proposal] = await db
            .select({
                id: projects.id,
                title: projects.title,
                description: projects.description,
                publicationDate: projects.publicationDate,
                status: projects.status,
                studentId: projects.studentId,
                tutorId: projects.tutorId,
            })
            .from(projects)
            .where(eq(projects.id, projectId))

        if (!proposal) {
            return res.status(404).json({ error: 'Project proposal not found' })
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

        const interestedRows = proposal.studentId
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
                .where(eq(matches.projectId, projectId))
            : []

        const isOwner = currentUser.role === 'student'
            ? proposal.studentId === currentUser.id
            : proposal.tutorId === currentUser.id

        let isMatchedViewer = false

        if (currentUser.role === 'student') {
            const [acceptedMatch] = await db
                .select({ projectId: matches.projectId })
                .from(matches)
                .where(and(
                    eq(matches.projectId, projectId),
                    eq(matches.userId, currentUser.id),
                    eq(matches.status, 'accepted')
                ))
                .limit(1)

            isMatchedViewer = Boolean(acceptedMatch)
        }

        if (currentUser.role === 'professor') {
            const [acceptedMatch] = await db
                .select({ projectId: matches.projectId })
                .from(matches)
                .where(and(
                    eq(matches.projectId, projectId),
                    eq(matches.userId, currentUser.id),
                    eq(matches.status, 'accepted')
                ))
                .limit(1)

            isMatchedViewer = Boolean(acceptedMatch)
        }

        const canSeeOwnerEmail = isOwner || isMatchedViewer
        
        const proposalData = {
            ...proposal,
            isOwner,
            tags: proposalTags.map(tag => tag.name),
            user: proposalUser ? {
                id: proposalUser.id,
                name: proposalUser.name,
                surname: proposalUser.surname,
                email: canSeeOwnerEmail ? proposalUser.email : null,
            } : null,
            interestedUsers: isOwner
                ? interestedRows.map((person) => ({
                    ...person,
                    email: person.matchStatus === 'accepted' ? person.email : null,
                    likedAt: null,
                }))
                : [],
        }
        return res.json({ proposal: proposalData })
        
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error fetching project proposal' })
    }
})

app.get('/tags', async (_req, res) => {
    try {
        const allTags = await db
            .select({ id: tags.id, name: tags.name })
            .from(tags)
            .orderBy(tags.name)

        return res.json({ tags: allTags })
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error fetching tags' })
    }
})

app.post('/proposals', validate(TFECreationSchema), async (req, res) => {
    const user = req.headers['x-user-email'] as string
    const { title, description, tags: tagNames } = req.body

    try {
        const [currentUser] = await db
            .select({ id: users.id, role: users.role })
            .from(users)
            .where(eq(users.email, user))
            .limit(1)

        if (!currentUser || (currentUser.role !== 'student' && currentUser.role !== 'professor')) {
            return res.status(404).json({ error: 'User not found' }) 
        }

        await db.transaction(async (trx) => {
            const [project] = await trx
                .insert(projects)
                .values(
                    currentUser.role === 'student'
                        ? { title, description, studentId: currentUser.id }
                        : { title, description, tutorId: currentUser.id }
                )
                .returning({ id: projects.id })
            
            if (tagNames?.length > 0) {
                const tagIds = await trx
                    .select({ id: tags.id })
                    .from(tags)
                    .where(inArray(tags.name, tagNames))

                if (tagIds.length !== tagNames.length) {
                    throw Object.assign(new Error('INVALID_TAGS'), { status: 400 })
                }

                await trx
                    .insert(projectTags)
                    .values(tagIds.map(tag => ({ projectId: project.id, tagId: tag.id })))
            }
        })

        return res.status(201).json({ message: 'Project proposal created successfully' })
        
    } catch (exception: any) {
        if (exception?.status === 400) {
            return res.status(400).json({ error: 'One or more tags are not allowed' })
        }
        console.error(exception)
        return res.status(500).json({ error: 'Error creating project proposal' })
    }
})

app.patch('/proposals/:id/renew', validate(GetTFESchema, 'params'), async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string
    const projectId = Number(req.params.id)

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    try {
        const currentUser = await getUserWithRole(userEmail)

        if (!currentUser) {
            return res.status(404).json({ error: 'Authenticated user not found or role not supported' })
        }

        const [proposal] = await db
            .select({ id: projects.id, studentId: projects.studentId, tutorId: projects.tutorId })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1)

        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found' })
        }

        const isOwner = currentUser.role === 'student'
            ? proposal.studentId === currentUser.id
            : proposal.tutorId === currentUser.id

        if (!isOwner) {
            return res.status(403).json({ error: 'Only the owner can renew a proposal' })
        }

        const renewedAt = new Date()
        const expiresAt = new Date(renewedAt)
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)

        await db.update(projects).set({ publicationDate: renewedAt }).where(eq(projects.id, projectId))

        return res.json({ publicationDate: renewedAt, renewedAt, expiresAt })
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error renewing proposal' })
    }
})

app.post('/proposals/:id/like', validate(GetTFESchema, 'params'), async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string
    const projectId = Number(req.params.id)

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    try {
        const currentUser = await getUserWithRole(userEmail)

        if (!currentUser) {
            return res.status(404).json({ error: 'Authenticated user not found or role not supported' })
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
            return res.status(404).json({ error: 'Proposal not available for likes' })
        }

        const { ownerId, ownerRole } = getOwner(proposal)

        if (!ownerId || !ownerRole) {
            return res.status(400).json({ error: 'Proposal owner not found' })
        }

        if (ownerId === currentUser.id) {
            return res.status(400).json({ error: 'You cannot like your own proposal' })
        }

        if (ownerRole === currentUser.role) {
            return res.status(400).json({ error: 'Only proposals from the opposite role can be liked' })
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

            const myOwnProjects = await trx
                .select({ id: projects.id })
                .from(projects)
                .where(currentUser.role === 'student' ? eq(projects.studentId, currentUser.id) : eq(projects.tutorId, currentUser.id))

            const myOwnProjectIds = myOwnProjects.map((ownProject) => ownProject.id)

            if (myOwnProjectIds.length === 0) {
                return
            }

            const [reciprocalInterest] = await trx
                .select({ projectId: matches.projectId })
                .from(matches)
                .where(and(
                    inArray(matches.projectId, myOwnProjectIds),
                    eq(matches.userId, ownerId),
                    inArray(matches.status, ['pending', 'accepted'])
                ))
                .limit(1)

            if (reciprocalInterest) {
                await trx
                    .update(matches)
                    .set({ status: 'accepted' })
                    .where(and(eq(matches.projectId, projectId), eq(matches.userId, currentUser.id)))

                await trx
                    .update(matches)
                    .set({ status: 'accepted' })
                    .where(and(eq(matches.projectId, reciprocalInterest.projectId), eq(matches.userId, ownerId)))

                await trx
                    .update(projects)
                    .set({ status: 'in_progress' })
                    .where(eq(projects.id, projectId))

                await trx
                    .update(projects)
                    .set({ status: 'in_progress' })
                    .where(eq(projects.id, reciprocalInterest.projectId))
            }
        })

        const [updatedInteraction] = await db
            .select({ status: matches.status })
            .from(matches)
            .where(and(eq(matches.projectId, projectId), eq(matches.userId, currentUser.id)))
            .limit(1)

        return res.json({
            liked: true,
            matchStatus: updatedInteraction?.status ?? 'pending',
            matched: updatedInteraction?.status === 'accepted',
        })
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error creating like for proposal' })
    }
})

app.post('/proposals/:id/pass', validate(GetTFESchema, 'params'), async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string
    const projectId = Number(req.params.id)

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    try {
        const currentUser = await getUserWithRole(userEmail)

        if (!currentUser) {
            return res.status(404).json({ error: 'Authenticated user not found or role not supported' })
        }

        const [proposal] = await db
            .select({ id: projects.id, studentId: projects.studentId, tutorId: projects.tutorId, status: projects.status })
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1)

        if (!proposal || proposal.status !== 'proposed') {
            return res.status(404).json({ error: 'Proposal not available' })
        }

        const { ownerId, ownerRole } = getOwner(proposal)
        const isValidDirection = Boolean(ownerId && ownerRole && ownerRole !== currentUser.role)

        if (!isValidDirection) {
            return res.status(400).json({ error: 'This proposal is not from the opposite role' })
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

            const [alreadyPassed] = await trx
                .select({ proposalId: proposalPasses.proposalId })
                .from(proposalPasses)
                .where(and(eq(proposalPasses.proposalId, projectId), eq(proposalPasses.userId, currentUser.id)))
                .limit(1)

            if (!alreadyPassed) {
                await trx.insert(proposalPasses).values({ proposalId: projectId, userId: currentUser.id })
            }
        })

        return res.json({ passed: true })
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error registering pass for proposal' })
    }
})

app.get('/admin/tags', async (_req, res) => {
    try {
        const allTags = await db.select().from(tags).orderBy(tags.name)
        return res.json({ tags: allTags })
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error fetching tags' })
    }
})

app.post('/admin/tags', async (req, res) => {
    const { name } = req.body

    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Tag name is required' })
    }

    try {
        const [existing] = await db
            .select()
            .from(tags)
            .where(eq(tags.name, name.trim()))
            .limit(1)

        if (existing) {
            return res.status(409).json({ error: 'Tag already exists' })
        }

        const [tag] = await db
            .insert(tags)
            .values({ name: name.trim() })
            .returning({ id: tags.id, name: tags.name })

        return res.status(201).json({ tag })
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error creating tag' })
    }
})

app.post('/admin/tags/import', validate(AdminTagImportSchema), async (req, res) => {
    const { tags: tagList } = req.body

    try {
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

        return res.json({
            message: 'Tag import completed',
            created,
            skipped,
            errors,
        })
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error importing tags' })
    }
})

app.delete('/admin/tags/:id', async (req, res) => {
    const tagId = Number(req.params.id)

    if (isNaN(tagId)) {
        return res.status(400).json({ error: 'Invalid tag ID' })
    }

    try {
        const [deleted] = await db
            .delete(tags)
            .where(eq(tags.id, tagId))
            .returning({ id: tags.id })

        if (!deleted) {
            return res.status(404).json({ error: 'Tag not found' })
        }

        return res.json({ message: 'Tag deleted' })
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error deleting tag' })
    }
})

app.listen(PORT, () => {
    console.log(`Project Service is running on port ${PORT}`)
})