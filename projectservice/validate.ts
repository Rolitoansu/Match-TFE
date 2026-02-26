import { Request, Response, NextFunction } from 'express'
import { treeifyError, ZodObject, string, optional } from 'zod'

export const validate = (schema: ZodObject) => 
    (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
        return res.status(400).json({ details: treeifyError(result.error) })
    }

    req.body = result.data
    next()
}

export const TfeSchema = ZodObject({
    page: string().optional(),
    pageSize: string().optional(),
    search: string().optional()
})