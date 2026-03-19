import { Router } from 'express'
import proxy from 'express-http-proxy'
import authMiddleware from '../middleware'

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://authservice:5000'
const PROJECT_SERVICE_URL = process.env.PROJECT_SERVICE_URL || 'http://projectservice:5002'
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://userservice:5001'
const router = Router()

router.post('/auth/login', proxy(AUTH_SERVICE_URL, {
    proxyReqPathResolver: () => '/admin/login'
}))
router.post('/auth/refresh', proxy(AUTH_SERVICE_URL, {
    proxyReqPathResolver: () => '/admin/refresh'
}))
router.post('/auth/logout', proxy(AUTH_SERVICE_URL, {
    proxyReqPathResolver: () => '/admin/logout'
}))

router.get('/tags', authMiddleware, proxy(PROJECT_SERVICE_URL, {
    proxyReqPathResolver: () => '/admin/tags'
}))
router.post('/tags', authMiddleware, proxy(PROJECT_SERVICE_URL, {
    proxyReqPathResolver: () => '/admin/tags'
}))
router.post('/tags/import', authMiddleware, proxy(PROJECT_SERVICE_URL, {
    proxyReqPathResolver: () => '/admin/tags/import'
}))
router.patch('/tags/:id', authMiddleware, proxy(PROJECT_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/admin/tags/${req.params.id}`
}))
router.delete('/tags/:id', authMiddleware, proxy(PROJECT_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/admin/tags/${req.params.id}`
}))
router.post('/students/import', authMiddleware, proxy(USER_SERVICE_URL, {
    proxyReqPathResolver: () => '/admin/students/import'
}))
router.post('/professors/import', authMiddleware, proxy(USER_SERVICE_URL, {
    proxyReqPathResolver: () => '/admin/professors/import'
}))
router.get('/users', authMiddleware, proxy(USER_SERVICE_URL, {
    proxyReqPathResolver: () => '/admin/users'
}))
router.patch('/users/:id', authMiddleware, proxy(USER_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/admin/users/${req.params.id}`
}))
router.delete('/users/:id', authMiddleware, proxy(USER_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/admin/users/${req.params.id}`
}))

export default router
