import { Router } from 'express'
import proxy from 'express-http-proxy'
import authMiddleware from '../middleware'

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notificationservice:5004'
const router = Router()

router.post('/students/email', authMiddleware, proxy(NOTIFICATION_SERVICE_URL))

export default router
