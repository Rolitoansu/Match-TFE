import express from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcrypt'
import { query } from './db'
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
        console.log('Token verified:', payload)
        res.json({ user: payload })
    } catch (error) {
        console.log(error)
        res.status(403).json({ user: null })
    }
})

app.post('/user', async (req, res) => {
    const pwd_hash = await bcrypt.hash(req.body.password, 10)
    await query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [req.body.username, pwd_hash])
})

interface LoginBody {
    email: string,
    password: string
}

app.post('/login', validate(LoginSchema), async (req, res) => {
    console.log(req.body)
    const passwordHash = await bcrypt.hash(req.body.password, 10)
    console.log("password:" + passwordHash)
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