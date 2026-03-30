import { Router } from 'express'
import proxy from 'express-http-proxy'
import authMiddleware from '../middleware'

const HOST = process.env.HOST || 'http://localhost'
const PORT = process.env.PORT || 5002
const PROJECT_SERVICE_URL = `${HOST}:${PORT}`

const router = Router()

router.get('/tags', authMiddleware, proxy(PROJECT_SERVICE_URL))
router.get('/explore', authMiddleware, proxy(PROJECT_SERVICE_URL))
router.get('/proposals', authMiddleware, proxy(PROJECT_SERVICE_URL))
router.get('/proposals/:id', authMiddleware, proxy(PROJECT_SERVICE_URL))
router.patch('/proposals/:id/renew', authMiddleware, proxy(PROJECT_SERVICE_URL))
router.patch('/proposals/:id/cancel', authMiddleware, proxy(PROJECT_SERVICE_URL))
router.patch('/proposals/:id/complete', authMiddleware, proxy(PROJECT_SERVICE_URL))
router.post('/proposals/:id/like', authMiddleware, proxy(PROJECT_SERVICE_URL))
router.post('/proposals/:id/pass', authMiddleware, proxy(PROJECT_SERVICE_URL))
router.post('/proposals/:id/match/:userId', authMiddleware, proxy(PROJECT_SERVICE_URL))
router.post('/proposals', authMiddleware, proxy(PROJECT_SERVICE_URL))
router.post('/refresh', proxy(PROJECT_SERVICE_URL))
router.post('/logout', proxy(PROJECT_SERVICE_URL))

export default router