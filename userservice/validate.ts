import { Request, Response, NextFunction } from 'express'
import { z, treeifyError, ZodObject } from 'zod'

export const validate = (schema: ZodObject, source: 'body' | 'params' | 'query' = 'body') => 
    (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source])

    if (!result.success) {
        return res.status(400).json({ details: treeifyError(result.error) })
    }

    req[source] = result.data
    next()
}

export const registerSchema = z.object({
    name: z.string("Expected name").min(2, "Name must be at least 2 characters long"),
    surname: z.string("Expected surname").min(2, "Surname must be at least 2 characters long"),
    email: z.email("Invalid email address"),
    password: z.string("Expected password").min(6, "Password must be at least 6 characters long"),
})

export const adminStudentSchema = z.object({
    students: z.array(z.object({
        email: z.email("Invalid email address"),
        name: z.string("Expected name").min(2, "Name must be at least 2 characters long"),
        surname: z.string("Expected surname").min(2, "Surname must be at least 2 characters long"),
    }))
})

export const updateProfileSchema = z.object({
    biography: z.string("Expected biography").max(2000, "Biography cannot exceed 2000 characters").nullable().optional(),
    interests: z.array(z.string().trim().min(1, 'Interest tag cannot be empty')).max(30, 'Too many interests').optional(),
}).refine((data) => data.biography !== undefined || data.interests !== undefined, {
    message: 'At least one profile field must be provided',
})

export const userIdParamsSchema = z.object({
    id: z.coerce.number('Invalid user ID')
        .int('Invalid user ID')
        .positive('Invalid user ID')
})