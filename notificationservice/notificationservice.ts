import express from 'express'
import cron from 'node-cron'
import { validate, sendStudentsEmailSchema } from './validate'
import { HttpError, NotificationApplicationService } from './services/notificationApplicationService'

const PORT = process.env.PORT || 5004

const app = express()
app.use(express.json())

const notificationService = new NotificationApplicationService()
const pendingMatchesCron = process.env.PENDING_MATCHES_CRON ?? '0 9 * * 1'
const pendingMatchesTimezone = process.env.NOTIFICATION_TIMEZONE ?? 'Europe/Madrid'

cron.schedule(
  pendingMatchesCron,
  async () => {
    try {
      const result = await notificationService.sendPendingMatchesReminderEmails()
      console.log('[notificationservice] pending-matches reminder job result:', result)
    } catch (error) {
      console.error('[notificationservice] pending-matches reminder job failed:', error)
    }
  },
  { timezone: pendingMatchesTimezone }
)

app.post('/students/email', validate(sendStudentsEmailSchema), async (req, res) => {
  const requesterEmail = req.headers['x-user-email'] as string

  if (!requesterEmail) {
    return res.status(401).json({ error: 'Missing authenticated user email' })
  }

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
    if (error instanceof HttpError) {
      return res.status(error.status).json(error.payload)
    }

    console.error(error)
    return res.status(500).json({ error: 'Error sending notification emails' })
  }
})

app.listen(PORT, () => {
  console.log(`Notification Service is running on port ${PORT}`)
  console.log(`[notificationservice] pending match reminders scheduled with cron "${pendingMatchesCron}" (${pendingMatchesTimezone})`)
})
