import express from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import validate, { LoginSchema } from './validate'
import { AuthApplicationService, HttpError } from './services/authApplicationService'

const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'secret'
const IS_PRODUCTION = process.env.STAGE === 'production'
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

const app = express()
app.use(express.json())
app.use(cookieParser())
const authService = new AuthApplicationService(JWT_SECRET)

const refreshCookieOptions = {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: IS_PRODUCTION,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
}

const clearCookieOptions = {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: IS_PRODUCTION,
}

function handleServiceError(error: unknown, res: express.Response, fallbackStatus = 500) {
    if (error instanceof HttpError) {
        return res.status(error.status).json(error.payload)
    }

    console.error(error)
    return res.status(fallbackStatus).send()
}

app.post('/refresh', async (req, res) => {
    const cookie = req.cookies['refresh_token']
    if (!cookie) return res.status(401).send()

    try {
        const result = await authService.refreshUserSession(cookie)
        return res.json({ access_token: result.accessToken, user: result.user })

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).send()
        }

        return handleServiceError(error, res)
    }
})

app.post('/admin/refresh', async (req, res) => {
    const cookie = req.cookies['admin_refresh_token']
    if (!cookie) return res.status(401).send()

    try {
        const result = await authService.refreshAdminSession(cookie)
        return res.json({ access_token: result.accessToken, admin: result.admin })

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).send()
        }

        return handleServiceError(error, res)
    }
})

app.post('/login', validate(LoginSchema), async (req, res) => {
    const { email, password } = req.body

    try {
        const result = await authService.loginUser(email, password)

        res.cookie('refresh_token', result.refreshToken, refreshCookieOptions)

        return res.json({ access_token: result.accessToken, user: result.user })

    } catch (error) {
        return handleServiceError(error, res)
    }
})

app.post('/admin/login', validate(LoginSchema), async (req, res) => {
    const { email, password } = req.body

    try {
        const result = await authService.loginAdmin(email, password)

        res.cookie('admin_refresh_token', result.refreshToken, refreshCookieOptions)

        return res.json({
            access_token: result.accessToken,
            admin: result.admin
        })

    } catch (error) {
        return handleServiceError(error, res)
    }
})

app.post('/logout', (_, res) => {
    res.clearCookie('refresh_token', clearCookieOptions)
    return res.status(204).send()
})

app.post('/admin/logout', (_, res) => {
    res.clearCookie('admin_refresh_token', clearCookieOptions)
    return res.status(204).send()
})

app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`)
})