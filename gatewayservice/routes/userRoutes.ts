import { Router } from 'express'
import proxy from 'express-http-proxy'

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://userservice:5001'
const router = Router()

router.post('/register', proxy(USER_SERVICE_URL))

export default router