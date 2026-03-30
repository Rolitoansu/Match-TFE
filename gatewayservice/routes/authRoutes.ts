import { Router } from 'express'
import proxy from 'express-http-proxy'

const HOST = process.env.HOST || 'http://localhost'
const PORT = process.env.AUTH_SERVICE_PORT || 5000
const AUTH_SERVICE_URL = `${HOST}:${PORT}`

const router = Router()

router.post('/login', proxy(AUTH_SERVICE_URL))
router.post('/refresh', proxy(AUTH_SERVICE_URL))
router.post('/logout', proxy(AUTH_SERVICE_URL))

export default router