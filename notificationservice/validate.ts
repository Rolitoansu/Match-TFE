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

export const createUserNotificationSchema = z.object({
  userId: z.number('Expected userId').int().positive(),
  type: z.string('Expected type').trim().min(2, 'Type is too short').max(50, 'Type is too long'),
  content: z.string('Expected content').trim().min(5, 'Content is too short').max(2000, 'Content is too long'),
})

export const notificationIdParamsSchema = z.object({
  id: z.coerce.number('Expected notification id').int().positive(),
})
