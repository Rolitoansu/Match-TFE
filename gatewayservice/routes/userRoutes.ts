import { Router } from 'express'
import proxy from 'express-http-proxy'
import authMiddleware from '../middleware'

const HOST = process.env.HOST || 'http://localhost'
const PORT = process.env.PORT || 5001
const USER_SERVICE_URL = `${HOST}:${PORT}`

const router = Router()

router.post('/register', proxy(USER_SERVICE_URL))
router.get('/profile', authMiddleware, proxy(USER_SERVICE_URL))
router.get('/proposals/:id', authMiddleware, proxy(USER_SERVICE_URL))
router.patch('/profile', authMiddleware, proxy(USER_SERVICE_URL))
router.get('/:id', authMiddleware, proxy(USER_SERVICE_URL))

export default router