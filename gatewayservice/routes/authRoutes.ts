import { Router } from 'express'
import proxy from 'express-http-proxy'

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://authservice:5000'

const router = Router()

router.post('/login', proxy(AUTH_SERVICE_URL))
router.post('/refresh', proxy(AUTH_SERVICE_URL))
router.post('/logout', proxy(AUTH_SERVICE_URL))
router.get('/microsoft/login', proxy(AUTH_SERVICE_URL))
router.get('/microsoft/callback', proxy(AUTH_SERVICE_URL))

export default router