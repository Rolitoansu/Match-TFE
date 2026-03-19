import { beforeEach, describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import db from '@match-tfe/db'
import { AuthApplicationService, HttpError } from './authApplicationService'

vi.mock('bcrypt', () => ({
  default: { compare: vi.fn() },
}))

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn(), sign: vi.fn() },
}))

vi.mock('@match-tfe/db', () => ({
  default: {
    select: vi.fn(),
  },
}))

function createSelectChain<T>(rows: T[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
    innerJoin: vi.fn().mockReturnThis(),
  }
}

describe('AuthApplicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws 401 on refreshUserSession when user does not exist', async () => {
    vi.mocked(jwt.verify).mockReturnValue({ email: 'missing@example.com' } as never)
    vi.mocked(db.select).mockReturnValueOnce(createSelectChain([]) as any)

    const service = new AuthApplicationService('secret')

    await expect(service.refreshUserSession('refresh-token')).rejects.toMatchObject({
      status: 401,
      payload: { message: 'User no longer exists' },
    })
  })

  it('returns access token and user payload on refreshUserSession success', async () => {
    vi.mocked(jwt.verify).mockReturnValue({ email: 'user@example.com' } as never)
    vi.mocked(db.select)
      .mockReturnValueOnce(
        createSelectChain([
          {
            id: 5,
            name: 'Ana',
            surname: 'Lopez',
            registrationDate: new Date('2026-01-01'),
            biography: null,
            role: 'student',
          },
        ]) as any
      )
      .mockReturnValueOnce(
        {
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ name: 'IA' }]),
        } as any
      )
    vi.mocked(jwt.sign).mockReturnValue('new-access-token' as never)

    const service = new AuthApplicationService('secret')
    const result = await service.refreshUserSession('refresh-token')

    expect(result.accessToken).toBe('new-access-token')
    expect(result.user.email).toBe('user@example.com')
    expect(result.user.interests).toEqual(['IA'])
  })

  it('throws 401 on refreshAdminSession when role is not admin', async () => {
    vi.mocked(jwt.verify).mockReturnValue({ email: 'user@example.com', role: 'student' } as never)

    const service = new AuthApplicationService('secret')

    await expect(service.refreshAdminSession('refresh-token')).rejects.toMatchObject({
      status: 401,
    })
  })

  it('throws 401 on refreshAdminSession when admin does not exist', async () => {
    vi.mocked(jwt.verify).mockReturnValue({ email: 'admin@example.com', role: 'admin' } as never)
    vi.mocked(db.select).mockReturnValueOnce(createSelectChain([]) as any)

    const service = new AuthApplicationService('secret')

    await expect(service.refreshAdminSession('refresh-token')).rejects.toMatchObject({
      status: 401,
      payload: { message: 'Admin no longer exists' },
    })
  })

  it('returns access token and admin on refreshAdminSession success', async () => {
    vi.mocked(jwt.verify).mockReturnValue({ email: 'admin@example.com', role: 'admin' } as never)
    vi.mocked(db.select).mockReturnValueOnce(createSelectChain([{ id: 1, email: 'admin@example.com' }]) as any)
    vi.mocked(jwt.sign).mockReturnValue('admin-access-token' as never)

    const service = new AuthApplicationService('secret')
    const result = await service.refreshAdminSession('refresh-token')

    expect(result.accessToken).toBe('admin-access-token')
    expect(result.admin).toEqual({ id: 1, email: 'admin@example.com' })
  })

  it('throws 401 on loginUser when user does not exist', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createSelectChain([]) as any)

    const service = new AuthApplicationService('secret')

    await expect(service.loginUser('user@example.com', 'password123')).rejects.toMatchObject({
      status: 401,
      payload: { message: 'Invalid credentials' },
    })
  })

  it('throws 401 on loginUser when password is invalid', async () => {
    vi.mocked(db.select).mockReturnValueOnce(
      createSelectChain([
        {
          id: 1,
          name: 'User',
          surname: 'Test',
          passwordHash: 'hash',
          registrationDate: new Date(),
          biography: null,
          role: 'student',
        },
      ]) as any
    )
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    const service = new AuthApplicationService('secret')

    await expect(service.loginUser('user@example.com', 'wrong')).rejects.toMatchObject({
      status: 401,
      payload: { message: 'Invalid credentials' },
    })
  })

  it('returns tokens and user payload on successful loginUser', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(
        createSelectChain([
          {
            id: 1,
            name: 'User',
            surname: 'Test',
            passwordHash: 'hash',
            registrationDate: new Date('2026-01-01'),
            biography: null,
            role: 'student',
          },
        ]) as any
      )
      .mockReturnValueOnce(
        {
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ name: 'IA' }, { name: 'Data' }]),
        } as any
      )

    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(jwt.sign)
      .mockReturnValueOnce('refresh-token' as never)
      .mockReturnValueOnce('access-token' as never)

    const service = new AuthApplicationService('secret')
    const result = await service.loginUser('user@example.com', 'password123')

    expect(result.refreshToken).toBe('refresh-token')
    expect(result.accessToken).toBe('access-token')
    expect(result.user.email).toBe('user@example.com')
    expect(result.user.interests).toEqual(['IA', 'Data'])
  })

  it('throws 401 on loginAdmin when admin does not exist', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createSelectChain([]) as any)

    const service = new AuthApplicationService('secret')

    await expect(service.loginAdmin('admin@example.com', 'password123')).rejects.toMatchObject({
      status: 401,
      payload: { message: 'Invalid credentials' },
    })
  })

  it('throws 401 on loginAdmin when password is invalid', async () => {
    vi.mocked(db.select).mockReturnValueOnce(
      createSelectChain([{ id: 1, email: 'admin@example.com', passwordHash: 'hash' }]) as any
    )
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    const service = new AuthApplicationService('secret')

    await expect(service.loginAdmin('admin@example.com', 'wrong')).rejects.toMatchObject({
      status: 401,
      payload: { message: 'Invalid credentials' },
    })
  })

  it('returns tokens and admin payload on successful loginAdmin', async () => {
    vi.mocked(db.select).mockReturnValueOnce(
      createSelectChain([{ id: 1, email: 'admin@example.com', passwordHash: 'hash' }]) as any
    )
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(jwt.sign)
      .mockReturnValueOnce('admin-refresh-token' as never)
      .mockReturnValueOnce('admin-access-token' as never)

    const service = new AuthApplicationService('secret')
    const result = await service.loginAdmin('admin@example.com', 'password123')

    expect(result.refreshToken).toBe('admin-refresh-token')
    expect(result.accessToken).toBe('admin-access-token')
    expect(result.admin).toEqual({ id: 1, email: 'admin@example.com' })
  })
})
