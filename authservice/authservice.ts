import express from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcrypt'
import { validate } from './validate.middleware'
import { LoginSchema } from './schemas'
import { db, users } from '@match-tfe/db'
import { eq } from 'drizzle-orm'

const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'secret'

const app = express()
app.use(express.json())
app.use(cookieParser())

async function obtainUserFromEmail(email: string) {
    const [user] = await db
        .select({ 
            name: users.name, 
            surname: users.surname, 
            passwordHash: users.passwordHash, 
            registrationDate: users.registrationDate, 
            biography: users.biography 
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

    return user
}

app.post('/refresh', async (req, res) => {
    const cookie = req.cookies['refresh_token']
    if (!cookie) return res.status(401).send()

    try {
        const payload = jwt.verify(cookie, JWT_SECRET) as jwt.JwtPayload
        
        const user = await obtainUserFromEmail(payload.email)
        if (!user) {
            return res.status(401).json({ message: "User no longer exists" })
        }

        const user_data = { 
            email: payload.email,
            name: user.name,
            surname: user.surname,
            registrationDate: user.registrationDate,
            biography: user.biography
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

app.post('/login', validate(LoginSchema), async (req, res) => {
    const { email, password } = req.body

    try {
        const [user] = await db
            .select({ 
                name: users.name, 
                surname: users.surname, 
                passwordHash: users.passwordHash, 
                registrationDate: users.registrationDate, 
                biography: users.biography 
            })
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

        if (user && await bcrypt.compare(password, user.passwordHash)) {
            const refreshToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' })
            const accessToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '15m' })

            const user_data = { 
                email, 
                name: user.name, 
                surname: user.surname, 
                registrationDate: user.registrationDate, 
                biography: user.biography 
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

app.post('/logout', (_, res) => {
    res.clearCookie('refresh_token', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.STAGE === 'production'
    })
    return res.status(204).send()
})

app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`)
})