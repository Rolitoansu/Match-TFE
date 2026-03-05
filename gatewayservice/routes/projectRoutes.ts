import { Router } from 'express'
import proxy from 'express-http-proxy'
import authMiddleware from '../middleware'

const PROJECT_SERVICE_URL = process.env.PROJECT_SERVICE_URL || 'http://projectservice:5002'
const router = Router()

router.get('/proposals', proxy(PROJECT_SERVICE_URL))
router.get('/proposals/:id', proxy(PROJECT_SERVICE_URL))
router.post('/proposals', authMiddleware, proxy(PROJECT_SERVICE_URL))
router.post('/refresh', proxy(PROJECT_SERVICE_URL))
router.post('/logout', proxy(PROJECT_SERVICE_URL))

export default router