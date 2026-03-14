import express from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcrypt'
import validate, { LoginSchema } from './validate'
import { users, administrators, userTags, tags } from '@match-tfe/db/schema'
import { eq } from 'drizzle-orm'
import db from '@match-tfe/db'

const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'secret'

const app = express()
app.use(express.json())
app.use(cookieParser())

app.post('/refresh', async (req, res) => {
    const cookie = req.cookies['refresh_token']
    if (!cookie) return res.status(401).send()

    try {
        const payload = jwt.verify(cookie, JWT_SECRET) as jwt.JwtPayload
        const [user] = await db
            .select({
                id: users.id, 
                name: users.name, 
                surname: users.surname, 
                passwordHash: users.passwordHash, 
                registrationDate: users.registrationDate, 
                biography: users.biography,
                role: users.role,
            })
            .from(users)
            .where(eq(users.email, payload.email))
            .limit(1)
            
        if (!user) {
            return res.status(401).json({ message: "User no longer exists" })
        }

        const interestRows = await db
            .select({ name: tags.name })
            .from(userTags)
            .innerJoin(tags, eq(tags.id, userTags.tagId))
            .where(eq(userTags.userId, user.id))

        const user_data = { 
            id: user.id,
            email: payload.email,
            name: user.name,
            surname: user.surname,
            registrationDate: user.registrationDate,
            biography: user.biography,
            role: user.role,
            interests: interestRows.map((row) => row.name),
        }

        const accessToken = jwt.sign({ email: payload.email }, JWT_SECRET, { expiresIn: '15m' })
        return res.json({ access_token: accessToken, user: user_data })

    } catch (error) {
        console.error(error)
        
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).send()
        }
        
        return res.status(500).send()
    }
})

app.post('/admin/refresh', async (req, res) => {
    const cookie = req.cookies['admin_refresh_token']
    if (!cookie) return res.status(401).send()

    try {
        const payload = jwt.verify(cookie, JWT_SECRET) as jwt.JwtPayload

        if (payload.role !== 'admin') {
            return res.status(401).send()
        }

        const [admin] = await db
            .select({ id: administrators.id, email: administrators.email })
            .from(administrators)
            .where(eq(administrators.email, payload.email))
            .limit(1)

        if (!admin) {
            return res.status(401).json({ message: 'Admin no longer exists' })
        }

        const accessToken = jwt.sign({ email: payload.email, role: 'admin' }, JWT_SECRET, { expiresIn: '15m' })
        return res.json({ access_token: accessToken, admin })

    } catch (error) {
        console.error(error)
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).send()
        }
        return res.status(500).send()
    }
})

app.post('/login', validate(LoginSchema), async (req, res) => {
    const { email, password } = req.body

    try {
        const [user] = await db
            .select({
                id: users.id,
                name: users.name, 
                surname: users.surname, 
                passwordHash: users.passwordHash, 
                registrationDate: users.registrationDate, 
                biography: users.biography,
                role: users.role,
            })
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

        if (user && await bcrypt.compare(password, user.passwordHash)) {
            const interestRows = await db
                .select({ name: tags.name })
                .from(userTags)
                .innerJoin(tags, eq(tags.id, userTags.tagId))
                .where(eq(userTags.userId, user.id))

            const refreshToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' })
            const accessToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '15m' })

            const user_data = {
                id: user.id,
                email, 
                name: user.name, 
                surname: user.surname, 
                registrationDate: user.registrationDate, 
                biography: user.biography,
                role: user.role,
                interests: interestRows.map((row) => row.name),
            }
            
            res.cookie('refresh_token', refreshToken, { 
                httpOnly: true, 
                sameSite: 'strict',
                secure: process.env.STAGE === 'production',
                maxAge: 30 * 24 * 60 * 60 * 1000
            })

            return res.json({ access_token: accessToken, user: user_data })
        }

        return res.status(401).json({ message: "Invalid credentials" })

    } catch (error) {
        console.error(error)
        return res.status(500).send()
    }
})

app.post('/admin/login', validate(LoginSchema), async (req, res) => {
    const { email, password } = req.body

    try {
        const [admin] = await db
            .select({
                id: administrators.id,
                email: administrators.email,
                passwordHash: administrators.passwordHash,
            })
            .from(administrators)
            .where(eq(administrators.email, email))
            .limit(1)

        if (admin && await bcrypt.compare(password, admin.passwordHash)) {
            const refreshToken = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '30d' })
            const accessToken = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '15m' })

            res.cookie('admin_refresh_token', refreshToken, {
                httpOnly: true,
                sameSite: 'strict',
                secure: process.env.STAGE === 'production',
                maxAge: 30 * 24 * 60 * 60 * 1000
            })

            return res.json({ 
                access_token: accessToken, 
                admin: { id: admin.id, email: admin.email } 
            })
        }

        return res.status(401).json({ message: 'Invalid credentials' })

    } catch (error) {
        console.error(error)
        return res.status(500).send()
    }
})

app.post('/logout', (_, res) => {
    res.clearCookie('refresh_token', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.STAGE === 'production'
    })
    return res.status(204).send()
})

app.post('/admin/logout', (_, res) => {
    res.clearCookie('admin_refresh_token', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.STAGE === 'production'
    })
    return res.status(204).send()
})

app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`)
})