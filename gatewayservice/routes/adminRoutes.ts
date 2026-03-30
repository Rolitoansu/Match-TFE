import { Router } from 'express'
import proxy from 'express-http-proxy'
import authMiddleware from '../middleware'

const HOST = process.env.HOST || 'http://localhost'

const AUTH_PORT = process.env.PORT || 5000
const AUTH_SERVICE_URL = `${HOST}:${AUTH_PORT}`

const USER_PORT = process.env.PORT || 5001
const USER_SERVICE_URL = `${HOST}:${USER_PORT}`

const PROJECT_PORT = process.env.PORT || 5002
const PROJECT_SERVICE_URL = `${HOST}:${PROJECT_PORT}`

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
