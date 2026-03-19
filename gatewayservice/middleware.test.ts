import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import authMiddleware from './middleware'

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}))

describe('gateway authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when authorization header is missing', () => {
    const req = { headers: {} } as any
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const res = { status } as any
    const next = vi.fn()

    authMiddleware(req, res, next)

    expect(status).toHaveBeenCalledWith(401)
    expect(json).toHaveBeenCalledWith({ message: 'Missing authorization header' })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next and injects x-user-email when token is valid', () => {
    vi.mocked(jwt.verify).mockReturnValue({ email: 'user@example.com' } as any)

    const req = { headers: { authorization: 'Bearer token' } } as any
    const res = { status: vi.fn(() => ({ json: vi.fn() })) } as any
    const next = vi.fn()

    authMiddleware(req, res, next)

    expect(req.headers['x-user-email']).toBe('user@example.com')
    expect(next).toHaveBeenCalledOnce()
  })

  it('returns 401 when token is invalid', () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('invalid token')
    })

    const req = { headers: { authorization: 'Bearer bad-token' } } as any
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const res = { status } as any
    const next = vi.fn()

    authMiddleware(req, res, next)

    expect(status).toHaveBeenCalledWith(401)
    expect(json).toHaveBeenCalledWith({ message: 'Invalid token' })
    expect(next).not.toHaveBeenCalled()
  })
})
