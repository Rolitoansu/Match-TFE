import { Router } from 'express'
import proxy from 'express-http-proxy'
import authMiddleware from '../middleware'

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notificationservice:5004'
const router = Router()

router.post('/students/email', authMiddleware, proxy(NOTIFICATION_SERVICE_URL))
router.get('/', authMiddleware, proxy(NOTIFICATION_SERVICE_URL))
router.patch('/:id/read', authMiddleware, proxy(NOTIFICATION_SERVICE_URL))
router.delete('/:id', authMiddleware, proxy(NOTIFICATION_SERVICE_URL))
router.delete('/', authMiddleware, proxy(NOTIFICATION_SERVICE_URL))

export default router
