import express from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import crypto from 'node:crypto'
import axios from 'axios'
import validate, { LoginSchema } from './validate'
import { AuthApplicationService, HttpError } from './services/authApplicationService'

const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'secret'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common'
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:8000/auth/microsoft/callback'
const MICROSOFT_ALLOWED_DOMAIN = process.env.MICROSOFT_ALLOWED_DOMAIN || ''
const IS_PRODUCTION = process.env.STAGE === 'production'

const app = express()
app.use(express.json())
app.use(cookieParser())
const authService = new AuthApplicationService(JWT_SECRET)

function buildMicrosoftLoginUrl(state: string) {
    const params = new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID || '',
        response_type: 'code',
        redirect_uri: MICROSOFT_REDIRECT_URI,
        response_mode: 'query',
        scope: 'openid profile email',
        state,
    })

    return `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`
}

function buildFrontendRedirect(path: string) {
    return `${FRONTEND_URL.replace(/\/$/, '')}${path}`
}

function extractEmailFromIdToken(idToken: string): string {
    const decoded = jwt.decode(idToken) as jwt.JwtPayload | null
    if (!decoded || decoded.aud !== MICROSOFT_CLIENT_ID) {
        throw new HttpError(401, { message: 'Invalid Microsoft token audience' })
    }

    const email = decoded?.email || decoded?.preferred_username || decoded?.upn

    if (typeof email !== 'string' || !email.includes('@')) {
        throw new HttpError(401, { message: 'Unable to determine Microsoft account email' })
    }

    return email.trim().toLowerCase()
}

function ensureAllowedDomain(email: string) {
    if (!MICROSOFT_ALLOWED_DOMAIN) {
        return
    }

    const domain = email.split('@')[1]?.toLowerCase()
    if (domain !== MICROSOFT_ALLOWED_DOMAIN.toLowerCase()) {
        throw new HttpError(403, { message: 'This Microsoft account domain is not allowed' })
    }
}

app.get('/microsoft/login', (req, res) => {
    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
        return res.status(500).json({ message: 'Microsoft OAuth is not configured' })
    }

    const state = crypto.randomBytes(24).toString('hex')

    res.cookie('oauth_state', state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: IS_PRODUCTION,
        maxAge: 10 * 60 * 1000,
    })

    return res.redirect(buildMicrosoftLoginUrl(state))
})

app.get('/microsoft/callback', async (req, res) => {
    const { code, state } = req.query
    const cookieState = req.cookies['oauth_state']

    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
        return res.redirect(buildFrontendRedirect('/login?microsoft=error'))
    }

    if (typeof code !== 'string' || typeof state !== 'string' || !cookieState || state !== cookieState) {
        return res.redirect(buildFrontendRedirect('/login?microsoft=error'))
    }

    try {
        const tokenUrl = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`
        const body = new URLSearchParams({
            client_id: MICROSOFT_CLIENT_ID,
            client_secret: MICROSOFT_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: MICROSOFT_REDIRECT_URI,
            scope: 'openid profile email',
        })

        const tokenResponse = await axios.post(tokenUrl, body.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })

        const idToken = tokenResponse.data?.id_token
        if (typeof idToken !== 'string') {
            throw new HttpError(401, { message: 'Microsoft authentication failed' })
        }

        const email = extractEmailFromIdToken(idToken)
        ensureAllowedDomain(email)

        const result = await authService.loginUserWithMicrosoft(email)

        res.cookie('refresh_token', result.refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: IS_PRODUCTION,
            maxAge: 30 * 24 * 60 * 60 * 1000,
        })

        res.clearCookie('oauth_state', {
            httpOnly: true,
            sameSite: 'lax',
            secure: IS_PRODUCTION,
        })

        return res.redirect(buildFrontendRedirect('/home'))
    } catch (error) {
        console.error(error)
        return res.redirect(buildFrontendRedirect('/login?microsoft=error'))
    }
})

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

app.post('/login', async (_, res) => {
    return res.status(410).json({
        message: 'User/password login is disabled. Use Microsoft 365 sign-in instead.',
    })
})

app.post('/admin/login', validate(LoginSchema), async (req, res) => {
    const { email, password } = req.body

    try {
        const result = await authService.loginAdmin(email, password)

        res.cookie('admin_refresh_token', result.refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: IS_PRODUCTION,
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
        secure: IS_PRODUCTION
    })
    return res.status(204).send()
})

app.post('/admin/logout', (_, res) => {
    res.clearCookie('admin_refresh_token', {
        httpOnly: true,
        sameSite: 'strict',
        secure: IS_PRODUCTION
    })
    return res.status(204).send()
})

app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`)
})