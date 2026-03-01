import { Request, Response, NextFunction } from 'express'
import { treeifyError, ZodObject } from 'zod'
import { z } from 'zod'

export const validate = (schema: ZodObject<any>) => 
    (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
        return res.status(400).json({ details: treeifyError(result.error) })
    }

    req.body = result.data
    next()
}

export const LoginSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long")
})

export const TFESchema = z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).optional()
})