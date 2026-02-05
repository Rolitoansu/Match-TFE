import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { query } from './db.js'

const PORT = process.env.PORT || 5000

const app = express()


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

app.post('/login', async (req, res) => {

    await query('SELECT * FROM users WHERE username = $1', [req.body.username])
})

app.listen(PORT, () => {
    console.log('Auth Service is running on port 5000')
})