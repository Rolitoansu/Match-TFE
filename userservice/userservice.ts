import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { students, users } from '@match-tfe/db/schema'
import { validate, registerSchema } from './validate'
import { eq, sql } from 'drizzle-orm'
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

        await db.transaction(async (trx) => {
            const [user] = await trx.insert(users)
                .values({ email, name, surname, passwordHash, registrationDate: date })
                .returning({ id: users.id })

            await trx.insert(students)
                .values({ id: user.id })  
        })

        const refreshToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' })
        const accessToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '15m' })

        const user_data = { 
            email, 
            name: name, 
            surname: surname, 
            registrationDate: date, 
            biography: null 
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

app.get('/proposals', async (req, res) => {
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

app.listen(PORT, () => {
    console.log(`User Service is running on port ${PORT}`)
})