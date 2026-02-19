import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { db, users } from '@match-tfe/db'
import { validate, registerSchema } from './validate'
import { eq } from 'drizzle-orm'

const PORT = process.env.PORT || 5001
const app = express()

app.use(express.json())

app.post('/register', validate(registerSchema), async (req, res) => {
    const { email, name, surname, password } = req.body

    try {
        const existingUser = (await db.select().from(users).where(eq(users.email, email)))[0]
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' })
        }

        const passwordHash = await bcrypt.hash(password, 10)
        await db.insert(users).values({ email, name, surname, passwordHash })
    } catch (e: any) {
        console.error('Error inserting user:', e)
        return res.status(500).json({ error: 'Error creating user' })
    }
    
    const token = await jwt.sign({ email: email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' })
    return res.cookie('session_token', token, { httpOnly: true }).json({ user: { email, name, surname } })
})

app.listen(PORT, () => {
    console.log(`User Service is running on port ${PORT}`)
})