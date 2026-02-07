import { Request, Response, NextFunction } from 'express'
import { treeifyError, ZodType } from 'zod'

export const validate = (schema: ZodType<any, any, any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    console.log('Validating request body:', req.body)
    const result = schema.safeParse(req.body)

    if (!result.success) {
      return res.status(400).json({
        details: treeifyError(result.error)
      })
    }

    req.body = result.data
    next()
};