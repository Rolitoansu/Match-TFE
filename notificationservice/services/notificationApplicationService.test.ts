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
})
