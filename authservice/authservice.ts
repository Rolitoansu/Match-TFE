import express from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcrypt'
import { validate } from './validate.middleware'
import { LoginSchema } from './schemas'
import { db, users } from '@match-tfe/db'
import { eq } from 'drizzle-orm'

const PORT = process.env.PORT || 5000

const app = express()
app.use(express.json())
app.use(cookieParser())

app.get('/verify-cookie', async (req, res) => {
    const cookie = req.cookies['session_token']
    if (!cookie) {
        return res.status(401).json({ user: null })
    }

    try {
        const payload = jwt.verify(cookie, process.env.JWT_SECRET! || 'secret')
        res.json({ user: payload })
    } catch (error) {
        res.status(403).json({ user: null })
    }
})

app.post('/login', validate(LoginSchema), async (req, res) => {
    const user = (await db
        .select()
        .from(users)
        .where(
            eq(users.email, req.body.email)
        ))[0]

    console.log('User found:', user)

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = await jwt.sign({ email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' })
        res.cookie('session_token', token, { httpOnly: true })
        return res.json({ user: { email: user.email, name: user.name, surname: user.surname } }) 
    }

    return res.status(401).json({ error: 'Invalid credentials' })   
})

app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`)
})