import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { users, userTags } from '@match-tfe/db/schema'
import { validate, registerSchema, adminStudentSchema, updateProfileSchema } from './validate'
import { eq, inArray, sql } from 'drizzle-orm'
import db from '@match-tfe/db'
import { projects, tags, projectTags } from '@match-tfe/db/schema'

const PORT = process.env.PORT || 5001
const JWT_SECRET = process.env.JWT_SECRET || 'secret'

const app = express()
app.use(express.json())

app.post('/register', validate(registerSchema), async (req, res) => {
    const { email, name, surname, password } = req.body

    try {
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)
            
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' })
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const date = new Date()
        let userData: any

        await db.transaction(async (trx) => {
            const [user] = await trx.insert(users)
                .values({ email, name, surname, passwordHash, registrationDate: date, role: 'student' })
                .returning({ id: users.id })

            userData = user
        })

        if (!userData) {
            throw new Error('User creation failed')
        }

        const refreshToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' })
        const accessToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '15m' })

        const user_data = { 
            id: userData.id,
            email, 
            name: name, 
            surname: surname, 
            registrationDate: date, 
            biography: null,
            role: 'student',
            interests: [],
        }

        res.cookie('refresh_token', refreshToken, { 
            httpOnly: true, 
            sameSite: 'strict',
            secure: process.env.STAGE === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000
        })

        return res.json({ access_token: accessToken, user: user_data })
    } catch (e: any) {
        console.error(e)
        return res.status(500).json({ error: 'Error creating user' })
    }
})

app.get('/proposals/:id', async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string

    try {
        const proposals = await db
            .select({
                id: projects.id,
                title: projects.title,
                description: projects.description,
                publicationDate: projects.publicationDate,
                status: projects.status,
                tags: sql`json_agg(${tags.name})`.as('tags')
            })
            .from(projects)
            .innerJoin(users, eq(users.id, projects.studentId))
            .leftJoin(projectTags, eq(projectTags.projectId, projects.id))
            .leftJoin(tags, eq(tags.id, projectTags.tagId))
            .where(eq(users.email, userEmail))
            .groupBy(projects.id)
            .limit(10)

        return res.json({ proposals })
        
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error fetching project proposals' })
    }
})

app.get('/profile', async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    try {
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
            return res.status(404).json({ error: 'Authenticated user not found' })
        }

        const interestRows = await db
            .select({ name: tags.name })
            .from(userTags)
            .innerJoin(tags, eq(tags.id, userTags.tagId))
            .where(eq(userTags.userId, profile.id))

        return res.json({ user: { ...profile, interests: interestRows.map((row) => row.name) } })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Error fetching user profile' })
    }
})

app.patch('/profile', validate(updateProfileSchema), async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    const biography = req.body.biography !== undefined
        ? (req.body.biography?.trim() || null)
        : undefined
    const interests = req.body.interests as string[] | undefined

    try {
        const [currentUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, userEmail))
            .limit(1)

        if (!currentUser) {
            return res.status(404).json({ error: 'Authenticated user not found' })
        }

        if (biography !== undefined) {
            await db
                .update(users)
                .set({ biography })
                .where(eq(users.id, currentUser.id))
        }

        if (interests !== undefined) {
            const normalizedInterests = [...new Set(interests.map((name) => name.trim()).filter(Boolean))]
            const tagRows = normalizedInterests.length > 0
                ? await db
                    .select({ id: tags.id, name: tags.name })
                    .from(tags)
                    .where(inArray(tags.name, normalizedInterests))
                : []

            if (tagRows.length !== normalizedInterests.length) {
                return res.status(400).json({ error: 'One or more interests are not valid tags' })
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
            return res.status(404).json({ error: 'Authenticated user not found' })
        }

        const updatedInterestRows = await db
            .select({ name: tags.name })
            .from(userTags)
            .innerJoin(tags, eq(tags.id, userTags.tagId))
            .where(eq(userTags.userId, currentUser.id))

        return res.json({ user: { ...updatedUser, interests: updatedInterestRows.map((row) => row.name) } })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Error updating user profile' })
    }
})

app.post('/admin/students/import', validate(adminStudentSchema), async (req, res) => {
    const { students: studentList } = req.body

    let created = 0
    let skipped = 0
    const errors: string[] = []

    for (const student of studentList) {
        const { email, name, surname } = student

        if (!email || !name || !surname) {
            errors.push(`Datos incompletos para: ${email || 'sin correo'}`)
            skipped++
            continue
        }

        try {
            const [existing] = await db
                .select()
                .from(users)
                .where(eq(users.email, email))
                .limit(1)

            if (existing) {
                skipped++
                continue
            }

            // Default password: the email prefix before @
            const defaultPassword = email.split('@')[0]
            const passwordHash = await bcrypt.hash(defaultPassword, 10)

            await db.transaction(async (trx) => {
                await trx.insert(users)
                    .values({ email, name, surname, passwordHash, registrationDate: new Date(), role: 'student' })
            })

            created++
        } catch (e: any) {
            errors.push(`Error al crear ${email}: ${e.message}`)
            skipped++
        }
    }

    return res.json({ created, skipped, errors })
})

app.listen(PORT, () => {
    console.log(`User Service is running on port ${PORT}`)
})