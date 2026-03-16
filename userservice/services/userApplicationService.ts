import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import db from '@match-tfe/db'
import { projects, projectTags, tags, userTags, users } from '@match-tfe/db/schema'
import { desc, eq, inArray } from 'drizzle-orm'

export class HttpError extends Error {
    constructor(
        public readonly status: number,
        public readonly payload: Record<string, unknown>
    ) {
        super(String(payload.error ?? payload.message ?? 'Request failed'))
    }
}

type RegisterStudentInput = {
    email: string
    name: string
    surname: string
    password: string
}

type UpdateProfileInput = {
    biography?: string | null
    interests?: string[]
}

export class UserApplicationService {
    constructor(private readonly jwtSecret: string) {}

    async registerStudent(input: RegisterStudentInput) {
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, input.email))
            .limit(1)

        if (existingUser) {
            throw new HttpError(409, { error: 'User already exists' })
        }

        const passwordHash = await bcrypt.hash(input.password, 10)
        const registrationDate = new Date()
        let createdUserId: number | null = null

        await db.transaction(async (trx) => {
            const [createdUser] = await trx
                .insert(users)
                .values({
                    email: input.email,
                    name: input.name,
                    surname: input.surname,
                    passwordHash,
                    registrationDate,
                    role: 'student',
                })
                .returning({ id: users.id })

            createdUserId = createdUser?.id ?? null
        })

        if (!createdUserId) {
            throw new Error('User creation failed')
        }

        const refreshToken = jwt.sign({ email: input.email }, this.jwtSecret, { expiresIn: '30d' })
        const accessToken = jwt.sign({ email: input.email }, this.jwtSecret, { expiresIn: '15m' })

        return {
            refreshToken,
            accessToken,
            user: {
                id: createdUserId,
                email: input.email,
                name: input.name,
                surname: input.surname,
                registrationDate,
                biography: null,
                role: 'student',
                interests: [],
            },
        }
    }

    async getUserProposals(userId: number) {
        const [user] = await db
            .select({ id: users.id, role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)

        if (!user) {
            throw new HttpError(404, { error: 'User not found' })
        }

        const proposalRows = await db
            .select({
                id: projects.id,
                title: projects.title,
                description: projects.description,
                publicationDate: projects.publicationDate,
                status: projects.status,
            })
            .from(projects)
            .where(
                user.role === 'student'
                    ? eq(projects.studentId, user.id)
                    : eq(projects.tutorId, user.id)
            )
            .orderBy(desc(projects.publicationDate))

        const proposalsWithTags = await Promise.all(
            proposalRows.map(async (proposal) => {
                const tagRows = await db
                    .select({ name: tags.name })
                    .from(tags)
                    .innerJoin(projectTags, eq(projectTags.tagId, tags.id))
                    .where(eq(projectTags.projectId, proposal.id))

                return {
                    ...proposal,
                    tags: tagRows.map((item) => item.name),
                }
            })
        )

        return { proposals: proposalsWithTags }
    }

    async getAuthenticatedProfile(userEmail: string) {
        const [profile] = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                surname: users.surname,
                registrationDate: users.registrationDate,
                biography: users.biography,
                role: users.role,
            })
            .from(users)
            .where(eq(users.email, userEmail))
            .limit(1)

        if (!profile) {
            throw new HttpError(404, { error: 'Authenticated user not found' })
        }

        const interestRows = await db
            .select({ name: tags.name })
            .from(userTags)
            .innerJoin(tags, eq(tags.id, userTags.tagId))
            .where(eq(userTags.userId, profile.id))

        return {
            user: {
                ...profile,
                interests: interestRows.map((row) => row.name),
            },
        }
    }

    async updateAuthenticatedProfile(userEmail: string, input: UpdateProfileInput) {
        const [currentUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, userEmail))
            .limit(1)

        if (!currentUser) {
            throw new HttpError(404, { error: 'Authenticated user not found' })
        }

        if (input.biography !== undefined) {
            await db
                .update(users)
                .set({ biography: input.biography })
                .where(eq(users.id, currentUser.id))
        }

        if (input.interests !== undefined) {
            const normalizedInterests = [...new Set(input.interests.map((name) => name.trim()).filter(Boolean))]
            const tagRows = normalizedInterests.length > 0
                ? await db
                    .select({ id: tags.id, name: tags.name })
                    .from(tags)
                    .where(inArray(tags.name, normalizedInterests))
                : []

            if (tagRows.length !== normalizedInterests.length) {
                throw new HttpError(400, { error: 'One or more interests are not valid tags' })
            }

            await db.delete(userTags).where(eq(userTags.userId, currentUser.id))

            if (tagRows.length > 0) {
                await db
                    .insert(userTags)
                    .values(tagRows.map((tag) => ({ userId: currentUser.id, tagId: tag.id })))
            }
        }

        const [updatedUser] = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                surname: users.surname,
                registrationDate: users.registrationDate,
                biography: users.biography,
                role: users.role,
            })
            .from(users)
            .where(eq(users.id, currentUser.id))
            .limit(1)

        if (!updatedUser) {
            throw new HttpError(404, { error: 'Authenticated user not found' })
        }

        const updatedInterestRows = await db
            .select({ name: tags.name })
            .from(userTags)
            .innerJoin(tags, eq(tags.id, userTags.tagId))
            .where(eq(userTags.userId, currentUser.id))

        return {
            user: {
                ...updatedUser,
                interests: updatedInterestRows.map((row) => row.name),
            },
        }
    }

    async getPublicProfile(userId: number) {
        const [profile] = await db
            .select({
                id: users.id,
                name: users.name,
                surname: users.surname,
                biography: users.biography,
                role: users.role,
                registrationDate: users.registrationDate,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)

        if (!profile) {
            throw new HttpError(404, { error: 'User not found' })
        }

        const interestRows = await db
            .select({ name: tags.name })
            .from(userTags)
            .innerJoin(tags, eq(tags.id, userTags.tagId))
            .where(eq(userTags.userId, profile.id))

        const proposalRows = await db
            .select({
                id: projects.id,
                title: projects.title,
                description: projects.description,
                status: projects.status,
                publicationDate: projects.publicationDate,
            })
            .from(projects)
            .where(
                profile.role === 'student'
                    ? eq(projects.studentId, profile.id)
                    : eq(projects.tutorId, profile.id)
            )
            .orderBy(desc(projects.publicationDate))

        return {
            user: {
                ...profile,
                interests: interestRows.map((row) => row.name),
                proposals: proposalRows,
            },
        }
    }

    async importStudents(studentList: Array<{ email: string; name: string; surname: string }>) {
        let created = 0
        let skipped = 0
        const errors: string[] = []

        for (const student of studentList) {
            const { email, name, surname } = student

            if (!email || !name || !surname) {
                errors.push(`Datos incompletos para: ${email || 'sin correo'}`)
                skipped += 1
                continue
            }

            try {
                const [existing] = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, email))
                    .limit(1)

                if (existing) {
                    skipped += 1
                    continue
                }

                const defaultPassword = email.split('@')[0]
                const passwordHash = await bcrypt.hash(defaultPassword, 10)

                await db.transaction(async (trx) => {
                    await trx
                        .insert(users)
                        .values({
                            email,
                            name,
                            surname,
                            passwordHash,
                            registrationDate: new Date(),
                            role: 'student',
                        })
                })

                created += 1
            } catch (error) {
                const reason = error instanceof Error ? error.message : 'Unknown error'
                errors.push(`Error al crear ${email}: ${reason}`)
                skipped += 1
            }
        }

        return { created, skipped, errors }
    }
}
