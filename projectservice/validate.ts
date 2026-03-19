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

export const TFECreationSchema = z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).optional()
})

export const GetTFESchema = z.object({
    id: z.coerce.number('Invalid project ID')
                .int('Invalid project ID')
                .positive('Invalid project ID')
})

export const AcceptMatchParamsSchema = z.object({
    id: z.coerce.number('Invalid project ID')
        .int('Invalid project ID')
        .positive('Invalid project ID'),
    userId: z.coerce.number('Invalid user ID')
        .int('Invalid user ID')
        .positive('Invalid user ID')
})

export const AdminTagImportSchema = z.object({
    tags: z.array(z.object({
        name: z.string('Expected tag name').trim().min(1, 'Tag name cannot be empty'),
    })).min(1, 'At least one tag is required')
})

export const AdminTagCreateSchema = z.object({
    name: z.string('Expected tag name').trim().min(1, 'Tag name cannot be empty')
})

export const TagIdParamsSchema = z.object({
    id: z.coerce.number('Invalid tag ID')
        .int('Invalid tag ID')
        .positive('Invalid tag ID')
})

export default validate