import { Router } from 'express'
import proxy from 'express-http-proxy'
import authMiddleware from '../middleware'

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://authservice:5000'
const PROJECT_SERVICE_URL = process.env.PROJECT_SERVICE_URL || 'http://projectservice:5002'
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://userservice:5001'
const router = Router()

// Admin authentication → auth service
router.post('/auth/login', proxy(AUTH_SERVICE_URL, {
    proxyReqPathResolver: () => '/admin/login'
}))
router.post('/auth/refresh', proxy(AUTH_SERVICE_URL, {
    proxyReqPathResolver: () => '/admin/refresh'
}))
router.post('/auth/logout', proxy(AUTH_SERVICE_URL, {
    proxyReqPathResolver: () => '/admin/logout'
}))

// Tag management → project service
router.get('/tags', authMiddleware, proxy(PROJECT_SERVICE_URL, {
    proxyReqPathResolver: () => '/admin/tags'
}))
router.post('/tags', authMiddleware, proxy(PROJECT_SERVICE_URL, {
    proxyReqPathResolver: () => '/admin/tags'
}))
router.delete('/tags/:id', authMiddleware, proxy(PROJECT_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/admin/tags/${req.params.id}`
}))

// Student import → user service
router.post('/students/import', authMiddleware, proxy(USER_SERVICE_URL, {
    proxyReqPathResolver: () => '/admin/students/import'
}))

export default router
