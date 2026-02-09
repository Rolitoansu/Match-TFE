import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { db, users } from '@match-tfe/db'
import { validate, registerSchema } from './validate'

const PORT = process.env.PORT || 5001
const app = express()

app.use(express.json())

app.post('/register', validate(registerSchema), async (req, res) => {
    console.log('Received user creation request:', req.body)
    const { email, name, surname, password } = req.body
    const passwordHash = await bcrypt.hash(password, 10)
    await db.insert(users).values({ email, name, surname, passwordHash })
    return res.send()
})

app.listen(PORT, () => {
    console.log(`User Service is running on port ${PORT}`)
})