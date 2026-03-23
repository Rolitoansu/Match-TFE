import { beforeEach, describe, expect, it, vi } from 'vitest'
import nodemailer from 'nodemailer'
import db from '@match-tfe/db'
import { HttpError, NotificationApplicationService } from './notificationApplicationService'

vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn() },
}))

vi.mock('@match-tfe/db', () => ({
  default: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

function createLimitChain<T>(rows: T[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  }
}

function createWhereChain<T>(rows: T[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(rows),
  }
}

function createWhereOrderChain<T>(rows: T[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(rows),
  }
}

function createOrderLimitChain<T>(rows: T[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  }
}

describe('NotificationApplicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws 403 when requester is not professor', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student', email: 's@example.com', name: 'Student' }]) as any)

    const service = new NotificationApplicationService()

    await expect(service.sendEmailToStudents({
      requesterEmail: 's@example.com',
      subject: 'Aviso',
      message: 'Mensaje de prueba suficientemente largo',
      studentIds: [10],
    })).rejects.toMatchObject<HttpError>({
      status: 403,
    })
  })

  it('sends emails to matched students', async () => {
    const sendMail = vi.fn().mockResolvedValue(undefined)
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail } as any)

    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 2, role: 'professor', email: 'p@example.com', name: 'Prof' }]) as any)
      .mockReturnValueOnce(createWhereChain([{ id: 10, email: 'st@example.com', name: 'Stu', surname: 'Dent' }]) as any)

    const service = new NotificationApplicationService()
    const result = await service.sendEmailToStudents({
      requesterEmail: 'p@example.com',
      subject: 'Asunto de prueba',
      message: 'Mensaje de prueba suficientemente largo para pasar validacion',
      studentIds: [10],
    })

    expect(sendMail).toHaveBeenCalledOnce()
    expect(result.sent).toBe(1)
    expect(result.failed).toBe(0)
  })

  it('lists user notifications and calculates unread count', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1 }]) as any)
      .mockReturnValueOnce(createOrderLimitChain([
        { id: 10, type: 'info', content: 'A', read: false, timestamp: new Date() },
        { id: 11, type: 'info', content: 'B', read: true, timestamp: new Date() },
      ]) as any)

    const service = new NotificationApplicationService()
    const result = await service.listUserNotifications('student@example.com')

    expect(result.notifications).toHaveLength(2)
    expect(result.unreadCount).toBe(1)
  })

  it('marks a notification as read', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1 }]) as any)
    vi.mocked(db.update).mockReturnValueOnce({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: 10, type: 'info', content: 'A', read: true, timestamp: new Date() },
          ]),
        }),
      }),
    } as any)

    const service = new NotificationApplicationService()
    const result = await service.markNotificationAsRead('student@example.com', 10)

    expect(result.notification.read).toBe(true)
    expect(result.message).toBe('Notification marked as read')
  })

  it('clears user notifications and returns deleted count', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1 }]) as any)
    vi.mocked(db.delete).mockReturnValueOnce({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 10 }, { id: 11 }]),
      }),
    } as any)

    const service = new NotificationApplicationService()
    const result = await service.clearUserNotifications('student@example.com')

    expect(result.deleted).toBe(2)
    expect(result.message).toBe('Notifications cleared successfully')
  })

  it('returns empty reminder result when no unread notifications exist', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createWhereOrderChain([]) as any)

    const service = new NotificationApplicationService()
    const result = await service.sendUnreadNotificationsSummaryEmails('UTC')

    expect(result).toMatchObject({
      sent: 0,
      failed: 0,
      recipients: [],
    })
  })

  it('skips reminder emails when frequency window has not elapsed', async () => {
    const nowUtcHour = new Date().getUTCHours()

    vi.mocked(db.select)
      .mockReturnValueOnce(createWhereOrderChain([
        {
          userId: 10,
          type: 'info',
          content: 'A',
          timestamp: new Date(),
        },
      ]) as any)
      .mockReturnValueOnce(createWhereChain([
        {
          id: 10,
          email: 'st@example.com',
          name: 'Stu',
          notificationFrequency: 'monthly',
          notificationReminderHour: nowUtcHour,
          lastReminderEmailSentAt: new Date(),
        },
      ]) as any)

    const service = new NotificationApplicationService()
    const result = await service.sendUnreadNotificationsSummaryEmails('UTC')

    expect(result.sent).toBe(0)
    expect(result.failed).toBe(0)
    expect(result.skipped).toBe(1)
  })

  it('skips reminder emails when notifications are disabled', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createWhereOrderChain([
        {
          userId: 10,
          type: 'info',
          content: 'A',
          timestamp: new Date(),
        },
      ]) as any)
      .mockReturnValueOnce(createWhereChain([
        {
          id: 10,
          email: 'st@example.com',
          name: 'Stu',
          notificationFrequency: 'disabled',
          notificationReminderHour: 9,
          lastReminderEmailSentAt: null,
        },
      ]) as any)

    const service = new NotificationApplicationService()
    const result = await service.sendUnreadNotificationsSummaryEmails('UTC')

    expect(result.sent).toBe(0)
    expect(result.skipped).toBe(1)
  })

  it('sends unread notification summary when user is due', async () => {
    const sendMail = vi.fn().mockResolvedValue(undefined)
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail } as any)
    const nowUtcHour = new Date().getUTCHours()

    vi.mocked(db.select)
      .mockReturnValueOnce(createWhereOrderChain([
        {
          userId: 10,
          type: 'match_pending',
          content: 'Tienes un match pendiente',
          timestamp: new Date(),
        },
      ]) as any)
      .mockReturnValueOnce(createWhereChain([
        {
          id: 10,
          email: 'st@example.com',
          name: 'Stu',
          notificationFrequency: 'daily',
          notificationReminderHour: nowUtcHour,
          lastReminderEmailSentAt: null,
        },
      ]) as any)

    vi.mocked(db.update).mockReturnValueOnce({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    } as any)

    const service = new NotificationApplicationService()
    const result = await service.sendUnreadNotificationsSummaryEmails('UTC')

    expect(sendMail).toHaveBeenCalledOnce()
    expect(result.sent).toBe(1)
    expect(result.failed).toBe(0)
  })
})
