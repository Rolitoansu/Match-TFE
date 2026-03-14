import express from 'express'
import db from '@match-tfe/db'
import { users, projects, tags, projectTags, students, professors, matches, proposalLikes, proposalPasses } from '@match-tfe/db/schema'
import validate, { GetTFESchema, TFECreationSchema } from './validate'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'

const PORT = process.env.PORT || 5002

const app = express()
app.use(express.json())

type UserRole = 'student' | 'professor'

async function getUserWithRole(userEmail: string) {
    const [user] = await db
        .select({ 
            id: users.id,
            role: sql<string>`
                CASE
                    WHEN ${students.id} IS NOT NULL THEN 'student'
                    WHEN ${professors.id} IS NOT NULL THEN 'professor'
                    ELSE NULL
                END
            `.as('role')
         })
        .from(users)
        .leftJoin(students, eq(students.id, users.id))
        .leftJoin(professors, eq(professors.id, users.id))
        .where(eq(users.email, userEmail))
        .limit(1)

    return user
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

        const proposals = await db
            .select({
                id: projects.id,
                title: projects.title,
                description: projects.description,
                publicationDate: projects.publicationDate,
                status: projects.status,
                interestCount: sql<number>`(
                    SELECT COUNT(*)::int
                    FROM proposal_likes pl
                    WHERE pl.proposal_id = ${projects.id}
                )`.as('interestCount'),
                likedByCurrentUser: sql<boolean>`EXISTS (
                    SELECT 1
                    FROM proposal_likes pl2
                    WHERE pl2.proposal_id = ${projects.id} AND pl2.user_id = ${currentUser.id}
                )`.as('likedByCurrentUser'),
                tags: sql`COALESCE(json_agg(DISTINCT ${tags.name}) FILTER (WHERE ${tags.name} IS NOT NULL), '[]'::json)`.as('tags')
            })
            .from(projects)
            .leftJoin(projectTags, eq(projectTags.projectId, projects.id))
            .leftJoin(tags, eq(tags.id, projectTags.tagId))
            .where(eq(projects.status, 'proposed'))
            .groupBy(projects.id)
            .orderBy(desc(projects.publicationDate))
            .limit(50)

        return res.json({ proposals })
        
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

        if (currentUser.role === 'student') {
            const proposals = await db
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
                    liked: sql<boolean>`CASE WHEN ${proposalLikes.userId} IS NULL THEN false ELSE true END`.as('liked'),
                    matchStatus: matches.status,
                    tags: sql`COALESCE(json_agg(DISTINCT ${tags.name}) FILTER (WHERE ${tags.name} IS NOT NULL), '[]'::json)`.as('tags')
                })
                .from(projects)
                .innerJoin(users, eq(users.id, projects.tutorId))
                .innerJoin(professors, eq(professors.id, users.id))
                .leftJoin(projectTags, eq(projectTags.projectId, projects.id))
                .leftJoin(tags, eq(tags.id, projectTags.tagId))
                .leftJoin(proposalLikes, and(eq(proposalLikes.proposalId, projects.id), eq(proposalLikes.userId, currentUser.id)))
                .leftJoin(proposalPasses, and(eq(proposalPasses.proposalId, projects.id), eq(proposalPasses.userId, currentUser.id)))
                .leftJoin(matches, and(eq(matches.studentId, currentUser.id), eq(matches.professorId, users.id)))
                .where(and(
                    eq(projects.status, 'proposed'),
                    sql`(${matches.status} IS NULL)`,
                    sql`${proposalLikes.userId} IS NULL`,
                    sql`${proposalPasses.userId} IS NULL`
                ))
                .groupBy(
                    projects.id,
                    users.id,
                    proposalPasses.userId,
                    proposalLikes.userId,
                    matches.status
                )
                .orderBy(desc(projects.publicationDate))

            return res.json({ viewerRole: currentUser.role, proposals })
        }

        const proposals = await db
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
                liked: sql<boolean>`CASE WHEN ${proposalLikes.userId} IS NULL THEN false ELSE true END`.as('liked'),
                matchStatus: matches.status,
                tags: sql`COALESCE(json_agg(DISTINCT ${tags.name}) FILTER (WHERE ${tags.name} IS NOT NULL), '[]'::json)`.as('tags')
            })
            .from(projects)
            .innerJoin(users, eq(users.id, projects.studentId))
            .innerJoin(students, eq(students.id, users.id))
            .leftJoin(projectTags, eq(projectTags.projectId, projects.id))
            .leftJoin(tags, eq(tags.id, projectTags.tagId))
            .leftJoin(proposalLikes, and(eq(proposalLikes.proposalId, projects.id), eq(proposalLikes.userId, currentUser.id)))
            .leftJoin(proposalPasses, and(eq(proposalPasses.proposalId, projects.id), eq(proposalPasses.userId, currentUser.id)))
            .leftJoin(matches, and(eq(matches.studentId, users.id), eq(matches.professorId, currentUser.id)))
            .where(and(
                eq(projects.status, 'proposed'),
                sql`(${matches.status} IS NULL)`,
                sql`${proposalLikes.userId} IS NULL`,
                sql`${proposalPasses.userId} IS NULL`
            ))
            .groupBy(
                projects.id,
                users.id,
                proposalPasses.userId,
                proposalLikes.userId,
                matches.status
            )
            .orderBy(desc(projects.publicationDate))

        return res.json({ viewerRole: currentUser.role, proposals })
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error fetching explore proposals' })
    }
})

app.get('/proposals/:id', validate(GetTFESchema, 'params'), async (req, res) => {
    const projectId = Number(req.params.id)

    try {
        const [proposal] = await db
            .select({
                title: projects.title,
                description: projects.description,
                publicationDate: projects.publicationDate,
                status: projects.status,
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
        
        const [proposalUser] = await db
            .select({ name: users.name, surname: users.surname })
            .from(users)
            .innerJoin(projects, eq(projects.id, projectId))
            .where(eq(projects.studentId, users.id))
        
        const proposalData = {
            ...proposal,
            tags: proposalTags.map(tag => tag.name),
            user: proposalUser
        }
        return res.json({ proposal: proposalData })
        
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error fetching project proposal' })
    }
})

app.post('/proposals', validate(TFECreationSchema), async (req, res) => {
    const user = req.headers['x-user-email'] as string
    const { title, description, tags: tagNames } = req.body

    try {
        const [userId] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, user))
            .limit(1)

        if (!userId) {
            return res.status(404).json({ error: 'User not found' }) 
        }

        await db.transaction(async (trx) => {
            // IMPORTANTE: Cambiar cuando se tenga IAM. Por ahora se asume que el usuario es un estudiante.
            const [project] = await trx
                .insert(projects)
                .values({ title, description, studentId: userId.id })
                .returning({ id: projects.id })
            
            if (tagNames?.length > 0) {
                const tagIds = await trx
                    .select({ id: tags.id })
                    .from(tags)
                    .where(inArray(tags.name, tagNames)) 
                
                if (tagIds.length > 0) {
                    await trx
                        .insert(projectTags)
                        .values(tagIds.map(tag => ({ projectId: project.id, tagId: tag.id })))
                }
            }
        })

        return res.status(201).json({ message: 'Project proposal created successfully' })
        
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error creating project proposal' })
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

        let studentIdForMatch: number
        let professorIdForMatch: number
        let hasReciprocalInterest = false

        if (currentUser.role === 'student') {
            if (!proposal.tutorId) {
                return res.status(400).json({ error: 'Only professor proposals can be liked by students' })
            }

            studentIdForMatch = currentUser.id
            professorIdForMatch = proposal.tutorId

            const [reciprocalLike] = await db
                .select({ proposalId: proposalLikes.proposalId })
                .from(proposalLikes)
                .innerJoin(projects, eq(projects.id, proposalLikes.proposalId))
                .where(
                    and(
                        eq(proposalLikes.userId, professorIdForMatch),
                        eq(projects.studentId, studentIdForMatch)
                    )
                )
                .limit(1)

            hasReciprocalInterest = Boolean(reciprocalLike)
        } else {
            if (!proposal.studentId) {
                return res.status(400).json({ error: 'Only student proposals can be liked by professors' })
            }

            studentIdForMatch = proposal.studentId
            professorIdForMatch = currentUser.id

            const [reciprocalLike] = await db
                .select({ proposalId: proposalLikes.proposalId })
                .from(proposalLikes)
                .innerJoin(projects, eq(projects.id, proposalLikes.proposalId))
                .where(
                    and(
                        eq(proposalLikes.userId, studentIdForMatch),
                        eq(projects.tutorId, professorIdForMatch)
                    )
                )
                .limit(1)

            hasReciprocalInterest = Boolean(reciprocalLike)
        }

        await db.transaction(async (trx) => {
            const [existingLike] = await trx
                .select({ proposalId: proposalLikes.proposalId })
                .from(proposalLikes)
                .where(and(eq(proposalLikes.proposalId, projectId), eq(proposalLikes.userId, currentUser.id)))
                .limit(1)

            if (!existingLike) {
                await trx
                    .insert(proposalLikes)
                    .values({
                        proposalId: projectId,
                        userId: currentUser.id,
                    })
            }

            const [existingMatch] = await trx
                .select({ id: matches.id, status: matches.status })
                .from(matches)
                .where(and(eq(matches.studentId, studentIdForMatch), eq(matches.professorId, professorIdForMatch)))
                .limit(1)

            if (!existingMatch) {
                await trx
                    .insert(matches)
                    .values({
                        studentId: studentIdForMatch,
                        professorId: professorIdForMatch,
                        status: hasReciprocalInterest ? 'accepted' : 'pending',
                    })
                return
            }

            if (hasReciprocalInterest && existingMatch.status !== 'accepted') {
                await trx
                    .update(matches)
                    .set({ status: 'accepted', matchDate: new Date() })
                    .where(eq(matches.id, existingMatch.id))
            }
        })

        const [updatedMatch] = await db
            .select({ status: matches.status })
            .from(matches)
            .where(and(eq(matches.studentId, studentIdForMatch), eq(matches.professorId, professorIdForMatch)))
            .limit(1)

        return res.json({
            liked: true,
            matchStatus: updatedMatch?.status ?? 'pending',
            matched: updatedMatch?.status === 'accepted',
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

        const isValidDirection = currentUser.role === 'student'
            ? Boolean(proposal.tutorId)
            : Boolean(proposal.studentId)

        if (!isValidDirection) {
            return res.status(400).json({ error: 'This proposal is not from the opposite role' })
        }

        await db.transaction(async (trx) => {
            const [alreadyLiked] = await trx
                .select({ proposalId: proposalLikes.proposalId })
                .from(proposalLikes)
                .where(and(eq(proposalLikes.proposalId, projectId), eq(proposalLikes.userId, currentUser.id)))
                .limit(1)

            if (alreadyLiked) {
                return
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

// ── Admin: Tags management ──

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