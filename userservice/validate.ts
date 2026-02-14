import { Request, Response, NextFunction } from 'express'
import { z, treeifyError, ZodObject } from 'zod'

export const validate = (schema: ZodObject) => 
    (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
        return res.status(400).json({ details: treeifyError(result.error) })
    }

    req.body = result.data
    next()
}

export const registerSchema = z.object({
    name: z.string("Expected name").min(2, "Name must be at least 2 characters long"),
    surname: z.string("Expected surname").min(2, "Surname must be at least 2 characters long"),
    email: z.email("Invalid email address"),
    password: z.string("Expected password").min(6, "Password must be at least 6 characters long"),
})