import { describe, it, expect, vi } from 'vitest'
import validate, {
  AcceptMatchParamsSchema,
  AdminTagCreateSchema,
  AdminTagImportSchema,
  GetTFESchema,
  TFECreationSchema,
  TagIdParamsSchema,
} from './validate'

describe('projectservice validate middleware', () => {
  it('rejects invalid params for GetTFESchema', () => {
    const middleware = validate(GetTFESchema, 'params')
    const req = { params: { id: 'abc' } } as any
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const res = { status } as any
    const next = vi.fn()

    middleware(req, res, next)

    expect(status).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
  })

  it('accepts valid admin tag creation payload', () => {
    const middleware = validate(AdminTagCreateSchema)
    const req = { body: { name: 'IA' } } as any
    const res = { status: vi.fn() } as any
    const next = vi.fn()

    middleware(req, res, next)

    expect(next).toHaveBeenCalledOnce()
    expect(req.body.name).toBe('IA')
  })

  it('validates creation and admin import schemas', () => {
    expect(
      TFECreationSchema.safeParse({ title: 'T', description: 'D', tags: ['IA'] }).success
    ).toBe(true)

    expect(
      AdminTagImportSchema.safeParse({ tags: [{ name: 'IA' }, { name: 'ML' }] }).success
    ).toBe(true)
  })

  it('coerces params schemas for ids', () => {
    expect(AcceptMatchParamsSchema.safeParse({ id: '1', userId: '2' }).success).toBe(true)
    expect(TagIdParamsSchema.safeParse({ id: '5' }).success).toBe(true)
  })
})
