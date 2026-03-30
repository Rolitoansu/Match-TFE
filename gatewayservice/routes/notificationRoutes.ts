import { Router } from 'express'
import proxy from 'express-http-proxy'
import authMiddleware from '../middleware'

const HOST = process.env.HOST || 'http://localhost'
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 5004
const NOTIFICATION_SERVICE_URL = `${HOST}:${PORT}`

const router = Router()

router.post('/students/email', authMiddleware, proxy(NOTIFICATION_SERVICE_URL))
router.get('/', authMiddleware, proxy(NOTIFICATION_SERVICE_URL))
router.patch('/:id/read', authMiddleware, proxy(NOTIFICATION_SERVICE_URL))
router.delete('/:id', authMiddleware, proxy(NOTIFICATION_SERVICE_URL))
router.delete('/', authMiddleware, proxy(NOTIFICATION_SERVICE_URL))

export default router
