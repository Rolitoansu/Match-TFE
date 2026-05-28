import { Request, Response, NextFunction } from 'express'
import { z, ZodObject } from 'zod'

function validate(schema: ZodObject<any>, source: 'body' | 'params' | 'query' = 'body') { 
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[source])

        if (!result.success) {
            return res.status(400).json(z.treeifyError(result.error))
        }

        req[source] = result.data
        next()
    }
}

export const LoginSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long")
})

export default validate