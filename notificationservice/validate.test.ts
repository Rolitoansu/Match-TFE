import { describe, it, expect, vi } from 'vitest'
import { validate, sendStudentsEmailSchema } from './validate'

describe('notificationservice validate middleware', () => {
  it('rejects payload with no recipients', () => {
    const parsed = sendStudentsEmailSchema.safeParse({
      subject: 'Hola',
      message: 'Mensaje suficientemente largo',
    })

    expect(parsed.success).toBe(false)
  })

  it('accepts payload with student ids', () => {
    const parsed = sendStudentsEmailSchema.safeParse({
      subject: 'Recordatorio',
      message: 'Este es un mensaje de prueba para estudiantes.',
      studentIds: [1, 2],
    })

    expect(parsed.success).toBe(true)
  })

  it('middleware rejects invalid request body', () => {
    const middleware = validate(sendStudentsEmailSchema)
    const req = { body: { subject: 'Hi', message: 'short', studentIds: [] } } as any
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const res = { status } as any
    const next = vi.fn()

    middleware(req, res, next)

    expect(status).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
  })
})
