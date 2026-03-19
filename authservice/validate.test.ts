import { describe, it, expect, vi } from 'vitest'
import validate, { LoginSchema } from './validate'

describe('auth validate middleware', () => {
  it('returns 400 when body is invalid', () => {
    const middleware = validate(LoginSchema)
    const req = { body: { email: 'bad-email', password: '123' } } as any
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const res = { status } as any
    const next = vi.fn()

    middleware(req, res, next)

    expect(status).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next and sanitizes body when valid', () => {
    const middleware = validate(LoginSchema)
    const req = { body: { email: 'user@example.com', password: '123456' } } as any
    const res = { status: vi.fn() } as any
    const next = vi.fn()

    middleware(req, res, next)

    expect(next).toHaveBeenCalledOnce()
    expect(req.body.email).toBe('user@example.com')
  })
})
