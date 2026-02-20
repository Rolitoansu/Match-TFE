import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { db, users } from '@match-tfe/db'
import { validate, registerSchema } from './validate'
import { eq } from 'drizzle-orm'

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

        await db
            .insert(users)
            .values({ email, name, surname, passwordHash, registrationDate: date })

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
    
    const token = await jwt.sign({ email: email }, JWT_SECRET, { expiresIn: '1h' })
    return res.cookie('session_token', token, { httpOnly: true }).json({ user: { email, name, surname } })
})

app.listen(PORT, () => {
    console.log(`User Service is running on port ${PORT}`)
})