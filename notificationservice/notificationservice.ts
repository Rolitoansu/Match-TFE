import express from 'express'
import cron from 'node-cron'
import { createUserNotificationSchema, notificationIdParamsSchema, sendStudentsEmailSchema, sendUserEmailNotificationSchema, validate } from './validate'
import { HttpError, NotificationApplicationService } from './services/notificationApplicationService'

const PORT = process.env.PORT || 5004

const app = express()
app.use(express.json())

let notificationService: NotificationApplicationService
try {
  notificationService = new NotificationApplicationService()
} catch (error) {
  console.error('[notificationservice] failed to initialize notification service:', error)
  process.exit(1)
}
const pendingMatchesCron = process.env.PENDING_MATCHES_CRON ?? '0 * * * *'
const pendingMatchesTimezone = process.env.NOTIFICATION_TIMEZONE ?? 'Europe/Madrid'

function getAuthenticatedEmail(req: express.Request, res: express.Response) {
  const requesterEmail = req.headers['x-user-email'] as string | undefined

  if (!requesterEmail) {
    res.status(401).json({ error: 'Missing authenticated user email' })
    return null
  }

  return requesterEmail
}

function handleServiceError(error: unknown, res: express.Response, fallbackMessage: string) {
  if (error instanceof HttpError) {
    return res.status(error.status).json(error.payload)
  }

  console.error(error)
  return res.status(500).json({ error: fallbackMessage })
}

cron.schedule(
  pendingMatchesCron,
  async () => {
    try {
      const result = await notificationService.sendUnreadNotificationsSummaryEmails(pendingMatchesTimezone)
      console.log('[notificationservice] unread-notifications summary job result:', result)
    } catch (error) {
      console.error('[notificationservice] unread-notifications summary job failed:', error)
    }
  },
  { timezone: pendingMatchesTimezone }
)

app.post('/students/email', validate(sendStudentsEmailSchema), async (req, res) => {
  const requesterEmail = getAuthenticatedEmail(req, res)
  if (!requesterEmail) return

  try {
    const result = await notificationService.sendEmailToStudents({
      requesterEmail,
      subject: req.body.subject,
      message: req.body.message,
      studentIds: req.body.studentIds,
      studentEmails: req.body.studentEmails,
    })

    return res.json(result)
  } catch (error) {
    return handleServiceError(error, res, 'Error sending notification emails')
  }
})

app.post('/users/email', validate(sendUserEmailNotificationSchema), async (req, res) => {
  try {
    const result = await notificationService.sendUserEmail({
      userId: req.body.userId,
      type: req.body.type,
      subject: req.body.subject,
      content: req.body.content,
    })

    return res.status(201).json(result)
  } catch (error) {
    return handleServiceError(error, res, 'Error sending direct notification email')
  }
})

app.get('/', async (req, res) => {
  const requesterEmail = getAuthenticatedEmail(req, res)
  if (!requesterEmail) return

  try {
    const result = await notificationService.listUserNotifications(requesterEmail)
    return res.json(result)
  } catch (error) {
    return handleServiceError(error, res, 'Error listing notifications')
  }
})

app.post('/users', validate(createUserNotificationSchema), async (req, res) => {
  try {
    const result = await notificationService.createUserNotification({
      userId: req.body.userId,
      type: req.body.type,
      content: req.body.content,
    })

    return res.status(201).json(result)
  } catch (error) {
    return handleServiceError(error, res, 'Error creating notification')
  }
})

app.patch('/:id/read', validate(notificationIdParamsSchema, 'params'), async (req, res) => {
  const requesterEmail = getAuthenticatedEmail(req, res)
  if (!requesterEmail) return

  try {
    const notificationId = Number(req.params.id)
    const result = await notificationService.markNotificationAsRead(requesterEmail, notificationId)
    return res.json(result)
  } catch (error) {
    return handleServiceError(error, res, 'Error marking notification as read')
  }
})

app.delete('/:id', validate(notificationIdParamsSchema, 'params'), async (req, res) => {
  const requesterEmail = getAuthenticatedEmail(req, res)
  if (!requesterEmail) return

  try {
    const notificationId = Number(req.params.id)
    const result = await notificationService.deleteNotification(requesterEmail, notificationId)
    return res.json(result)
  } catch (error) {
    return handleServiceError(error, res, 'Error deleting notification')
  }
})

app.delete('/', async (req, res) => {
  const requesterEmail = getAuthenticatedEmail(req, res)
  if (!requesterEmail) return

  try {
    const result = await notificationService.clearUserNotifications(requesterEmail)
    return res.json(result)
  } catch (error) {
    return handleServiceError(error, res, 'Error clearing notifications')
  }
})

app.listen(PORT, () => {
  console.log(`Notification Service is running on port ${PORT}`)
  console.log(`[notificationservice] pending match reminders scheduled with cron "${pendingMatchesCron}" (${pendingMatchesTimezone})`)
})
