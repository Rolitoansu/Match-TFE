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
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    hola: z.string()
})