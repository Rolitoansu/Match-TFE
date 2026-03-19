import { describe, it, expect, vi } from 'vitest'
import {
  adminProfessorSchema,
  adminStudentSchema,
  adminUpdateUserSchema,
  userIdParamsSchema,
  validate,
  registerSchema,
  updateProfileSchema,
} from './validate'

describe('userservice validate middleware', () => {
  it('rejects invalid register payload', () => {
    const middleware = validate(registerSchema)
    const req = { body: { email: 'bad', name: 'A', surname: 'B', password: '123' } } as any
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const res = { status } as any
    const next = vi.fn()

    middleware(req, res, next)

    expect(status).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
  })

  it('accepts valid profile update when at least one field is present', () => {
    const middleware = validate(updateProfileSchema)
    const req = { body: { biography: 'Bio test' } } as any
    const res = { status: vi.fn() } as any
    const next = vi.fn()

    middleware(req, res, next)

    expect(next).toHaveBeenCalledOnce()
    expect(req.body.biography).toBe('Bio test')
  })

  it('rejects empty admin user update payload', () => {
    const parsed = adminUpdateUserSchema.safeParse({})

    expect(parsed.success).toBe(false)
  })

  it('accepts admin user update payload when at least one field is present', () => {
    const parsed = adminUpdateUserSchema.safeParse({ name: 'Mario' })

    expect(parsed.success).toBe(true)
  })

  it('rejects empty profile payload because at least one field is required', () => {
    const parsed = updateProfileSchema.safeParse({})

    expect(parsed.success).toBe(false)
  })

  it('validates student and professor admin batch schemas', () => {
    expect(
      adminStudentSchema.safeParse({
        students: [{ email: 's@example.com', name: 'Stu', surname: 'Dent' }],
      }).success
    ).toBe(true)

    expect(
      adminProfessorSchema.safeParse({
        professors: [{ email: 'p@example.com', name: 'Pro', surname: 'Fessor' }],
      }).success
    ).toBe(true)
  })

  it('validates and coerces user id params using params source', () => {
    const middleware = validate(userIdParamsSchema, 'params')
    const req = { params: { id: '12' } } as any
    const res = { status: vi.fn() } as any
    const next = vi.fn()

    middleware(req, res, next)

    expect(next).toHaveBeenCalledOnce()
    expect(req.params.id).toBe(12)
  })
})
