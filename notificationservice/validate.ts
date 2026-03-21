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

export const sendStudentsEmailSchema = z.object({
  subject: z.string('Expected subject').trim().min(3, 'Subject must be at least 3 characters long').max(140, 'Subject is too long'),
  message: z.string('Expected message').trim().min(10, 'Message must be at least 10 characters long').max(5000, 'Message is too long'),
  studentIds: z.array(z.number().int().positive()).max(200, 'Too many student ids').optional(),
  studentEmails: z.array(z.email('Invalid email address')).max(200, 'Too many student emails').optional(),
}).refine((data) => (data.studentIds?.length ?? 0) > 0 || (data.studentEmails?.length ?? 0) > 0, {
  message: 'At least one recipient list must be provided',
})
