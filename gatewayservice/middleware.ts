import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers?.authorization

    if (!authHeader) {
        return res.status(401).json({ message: 'Missing authorization header' })
    }

    const token = authHeader.split(' ')[1]

    try {
        const data = jwt.verify(token, JWT_SECRET) as { email: string }
        req.headers['x-user-email'] = data.email
        next()
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' })
    }
}

export default authMiddleware