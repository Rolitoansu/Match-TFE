import express from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import validate, { LoginSchema } from './validate'
import { AuthApplicationService, HttpError } from './services/authApplicationService'

const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'secret'

const app = express()
app.use(express.json())
app.use(cookieParser())
const authService = new AuthApplicationService(JWT_SECRET)

app.post('/refresh', async (req, res) => {
    const cookie = req.cookies['refresh_token']
    if (!cookie) return res.status(401).send()

    try {
        const result = await authService.refreshUserSession(cookie)
        return res.json({ access_token: result.accessToken, user: result.user })

    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json(error.payload)
        }

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
        const result = await authService.refreshAdminSession(cookie)
        return res.json({ access_token: result.accessToken, admin: result.admin })

    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json(error.payload)
        }

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
        const result = await authService.loginUser(email, password)

        res.cookie('refresh_token', result.refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.STAGE === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000
        })

        return res.json({ access_token: result.accessToken, user: result.user })

    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json(error.payload)
        }

        console.error(error)
        return res.status(500).send()
    }
})

app.post('/admin/login', validate(LoginSchema), async (req, res) => {
    const { email, password } = req.body

    try {
        const result = await authService.loginAdmin(email, password)

        res.cookie('admin_refresh_token', result.refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.STAGE === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000
        })

        return res.json({
            access_token: result.accessToken,
            admin: result.admin
        })

    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json(error.payload)
        }

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