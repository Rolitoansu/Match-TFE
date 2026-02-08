import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { query } from './db'
import { validate } from './validate.middleware'

const PORT = process.env.PORT || 5001

const app = express()
app.use(express.json())

app.post('/register', async (req, res) => {
    console.log('Received user creation request:', req.body)
    const { email, name, surname, password } = req.body
    const pwd_hash = await bcrypt.hash(password, 10)
    await query('INSERT INTO users (email, name, surname, password_hash) VALUES ($1, $2, $3, $4)', [email, name, surname, pwd_hash])
    return res.send()
})

app.listen(PORT, () => {
    console.log(`User Service is running on port ${PORT}`)
})