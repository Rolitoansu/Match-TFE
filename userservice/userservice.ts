import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { query } from './db'
import { validate } from './validate.middleware'

const PORT = process.env.PORT || 5001

const app = express()
app.use(express.json())

app.get('/verify-cookie', async (req, res) => {
    const token = req.cookies?.['access_token']
    if (!token)
        return res.status(401).json({ user: null })

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string)
        console.log('Token verified:', payload)
        res.json({ user: payload })
    } catch (error) {
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

app.post('/login', async (req, res) => {

    console.log(req.body)
    return res.json({ user: { id: 1, username: 'testuser' } })
})

app.listen(PORT, () => {
    console.log(`User Service is running on port ${PORT}`)
})