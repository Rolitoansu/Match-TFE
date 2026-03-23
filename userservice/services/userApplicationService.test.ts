import { beforeEach, describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import db from '@match-tfe/db'
import { HttpError, UserApplicationService } from './userApplicationService'

vi.mock('bcrypt', () => ({
  default: { hash: vi.fn() },
}))

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn() },
}))

vi.mock('@match-tfe/db', () => ({
  default: {
    select: vi.fn(),
    transaction: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    insert: vi.fn(),
  },
}))

function createLimitChain<T>(rows: T[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  }
}

function createOrderChain<T>(rows: T[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(rows),
  }
}

function createJoinWhereChain<T>(rows: T[]) {
  return {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(rows),
  }
}

describe('UserApplicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws 409 on registerStudent when user already exists', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([{ id: 1 }]) as any)

    const service = new UserApplicationService('secret')

    await expect(
      service.registerStudent({
        email: 'existing@example.com',
        name: 'Existing',
        surname: 'User',
        password: '123456',
      })
    ).rejects.toMatchObject({
      status: 409,
      payload: { error: 'User already exists' },
    })
  })

  it('throws generic error when registerStudent transaction does not return user id', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)
    vi.mocked(bcrypt.hash).mockResolvedValue('hash' as never)
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const trx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{}]),
          }),
        }),
      }
      await cb(trx)
    })

    const service = new UserApplicationService('secret')

    await expect(
      service.registerStudent({
        email: 'new@example.com',
        name: 'New',
        surname: 'User',
        password: '123456',
      })
    ).rejects.toThrow('User creation failed')
  })

  it('creates student and returns session tokens when registerStudent succeeds', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)
    vi.mocked(bcrypt.hash).mockResolvedValue('hash' as never)
    vi.mocked(jwt.sign)
      .mockReturnValueOnce('refresh-token' as never)
      .mockReturnValueOnce('access-token' as never)

    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const trx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 10 }]),
          }),
        }),
      }
      await cb(trx)
    })

    const service = new UserApplicationService('secret')
    const result = await service.registerStudent({
      email: 'new@example.com',
      name: 'New',
      surname: 'User',
      password: '123456',
    })

    expect(result.refreshToken).toBe('refresh-token')
    expect(result.accessToken).toBe('access-token')
    expect(result.user.id).toBe(10)
    expect(result.user.email).toBe('new@example.com')
    expect(result.user.role).toBe('student')
  })

  it('throws 404 when getUserProposals user is missing', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)
    const service = new UserApplicationService('secret')

    await expect(service.getUserProposals(1)).rejects.toMatchObject({
      status: 404,
      payload: { error: 'User not found' },
    })
  })

  it('returns proposals with tags in getUserProposals', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createOrderChain([{ id: 99, title: 'T', description: 'D', publicationDate: new Date(), status: 'proposed' }]) as any)
      .mockReturnValueOnce(createJoinWhereChain([{ name: 'IA' }]) as any)

    const service = new UserApplicationService('secret')
    const result = await service.getUserProposals(1)

    expect(result.proposals).toHaveLength(1)
    expect(result.proposals[0].tags).toEqual(['IA'])
  })

  it('throws 404 when getAuthenticatedProfile user is missing', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)
    const service = new UserApplicationService('secret')

    await expect(service.getAuthenticatedProfile('none@example.com')).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Authenticated user not found' },
    })
  })

  it('returns profile with interests in getAuthenticatedProfile', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 4, email: 'u@example.com', name: 'U', surname: 'S', registrationDate: new Date(), biography: null, role: 'student' }]) as any)
      .mockReturnValueOnce(createJoinWhereChain([{ name: 'Data' }]) as any)

    const service = new UserApplicationService('secret')
    const result = await service.getAuthenticatedProfile('u@example.com')

    expect(result.user.email).toBe('u@example.com')
    expect(result.user.interests).toEqual(['Data'])
  })

  it('throws 404 when updateAuthenticatedProfile user is missing', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)
    const service = new UserApplicationService('secret')

    await expect(service.updateAuthenticatedProfile('u@example.com', { biography: 'x' })).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Authenticated user not found' },
    })
  })

  it('throws 400 when updateAuthenticatedProfile receives invalid interests', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1 }]) as any)
      .mockReturnValueOnce(createJoinWhereChain([{ id: 10, name: 'IA' }]) as any)

    const service = new UserApplicationService('secret')

    await expect(service.updateAuthenticatedProfile('u@example.com', { interests: ['IA', 'Cloud'] })).rejects.toMatchObject({
      status: 400,
      payload: { error: 'One or more interests are not valid tags' },
    })
  })

  it('updates biography and interests in updateAuthenticatedProfile', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1 }]) as any)
      .mockReturnValueOnce(createJoinWhereChain([{ id: 10, name: 'IA' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 1, email: 'u@example.com', name: 'U', surname: 'S', registrationDate: new Date(), biography: 'Bio', role: 'student' }]) as any)
      .mockReturnValueOnce(createJoinWhereChain([{ name: 'IA' }]) as any)

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    } as any)
    vi.mocked(db.delete).mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) } as any)
    vi.mocked(db.insert).mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) } as any)

    const service = new UserApplicationService('secret')
    const result = await service.updateAuthenticatedProfile('u@example.com', { biography: 'Bio', interests: [' IA '] })

    expect(result.user.biography).toBe('Bio')
    expect(result.user.interests).toEqual(['IA'])
  })

  it('updates notification frequency in updateAuthenticatedProfile', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1 }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 1, email: 'u@example.com', name: 'U', surname: 'S', registrationDate: new Date(), biography: 'Bio', notificationFrequency: 'disabled', notificationReminderHour: 7, role: 'student' }]) as any)
      .mockReturnValueOnce(createJoinWhereChain([{ name: 'IA' }]) as any)

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    } as any)

    const service = new UserApplicationService('secret')
    const result = await service.updateAuthenticatedProfile('u@example.com', { notificationFrequency: 'disabled', notificationReminderHour: 7 })

    expect(result.user.notificationFrequency).toBe('disabled')
    expect(result.user.notificationReminderHour).toBe(7)
  })

  it('throws 404 when updateAuthenticatedProfile cannot refetch updated user', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1 }]) as any)
      .mockReturnValueOnce(createLimitChain([]) as any)

    const service = new UserApplicationService('secret')

    await expect(service.updateAuthenticatedProfile('u@example.com', {})).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Authenticated user not found' },
    })
  })

  it('throws 404 when getPublicProfile user is missing', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 99 }]) as any)
      .mockReturnValueOnce(createLimitChain([]) as any)
    const service = new UserApplicationService('secret')

    await expect(service.getPublicProfile(8, 'viewer@example.com')).rejects.toMatchObject({
      status: 404,
      payload: { error: 'User not found' },
    })
  })

  it('returns public profile for student role', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 2 }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 2, name: 'A', surname: 'B', email: 'a@example.com', biography: null, role: 'student', registrationDate: new Date() }]) as any)
      .mockReturnValueOnce(createJoinWhereChain([{ name: 'IA' }]) as any)
      .mockReturnValueOnce(createOrderChain([{ id: 11, title: 'T', description: 'D', status: 'proposed', publicationDate: new Date() }]) as any)

    const service = new UserApplicationService('secret')
    const result = await service.getPublicProfile(2, 'a@example.com')

    expect(result.user.email).toBe('a@example.com')
    expect(result.user.interests).toEqual(['IA'])
    expect(result.user.proposals).toHaveLength(1)
  })

  it('returns public profile for professor role', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 3 }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 3, name: 'P', surname: 'Q', email: 'p@example.com', biography: null, role: 'professor', registrationDate: new Date() }]) as any)
      .mockReturnValueOnce(createJoinWhereChain([]) as any)
      .mockReturnValueOnce(createOrderChain([]) as any)

    const service = new UserApplicationService('secret')
    const result = await service.getPublicProfile(3, 'p@example.com')

    expect(result.user.role).toBe('professor')
  })

  it('imports students handling incomplete, existing, success and error rows', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1 }]) as any)
      .mockReturnValueOnce(createLimitChain([]) as any)
      .mockReturnValueOnce(createLimitChain([]) as any)
    vi.mocked(bcrypt.hash).mockResolvedValue('hash' as never)
    vi.mocked(db.transaction)
      .mockImplementationOnce(async (cb: any) => {
        const trx = { insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }) }
        await cb(trx)
      })
      .mockImplementationOnce(async () => {
        throw new Error('db exploded')
      })

    const service = new UserApplicationService('secret')
    const result = await service.importStudents([
      { email: '', name: 'A', surname: 'B' },
      { email: 'exists@example.com', name: 'A', surname: 'B' },
      { email: 'ok@example.com', name: 'A', surname: 'B' },
      { email: 'fail@example.com', name: 'A', surname: 'B' },
    ])

    expect(result.created).toBe(1)
    expect(result.skipped).toBe(3)
    expect(result.errors.length).toBe(2)
  })

  it('imports professors handling incomplete, existing, success and unknown-error rows', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1 }]) as any)
      .mockReturnValueOnce(createLimitChain([]) as any)
      .mockReturnValueOnce(createLimitChain([]) as any)
    vi.mocked(bcrypt.hash).mockResolvedValue('hash' as never)
    vi.mocked(db.transaction)
      .mockImplementationOnce(async (cb: any) => {
        const trx = { insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }) }
        await cb(trx)
      })
      .mockImplementationOnce(async () => {
        throw 'boom'
      })

    const service = new UserApplicationService('secret')
    const result = await service.importProfessors([
      { email: '', name: 'A', surname: 'B' },
      { email: 'exists@example.com', name: 'A', surname: 'B' },
      { email: 'ok@example.com', name: 'A', surname: 'B' },
      { email: 'fail@example.com', name: 'A', surname: 'B' },
    ])

    expect(result.created).toBe(1)
    expect(result.skipped).toBe(3)
    expect(result.errors.some((e) => e.includes('Unknown error'))).toBe(true)
  })

  it('imports professors and captures Error message when transaction throws Error', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)
    vi.mocked(bcrypt.hash).mockResolvedValue('hash' as never)
    vi.mocked(db.transaction).mockImplementationOnce(async () => {
      throw new Error('professor insert failed')
    })

    const service = new UserApplicationService('secret')
    const result = await service.importProfessors([
      { email: 'fail@example.com', name: 'A', surname: 'B' },
    ])

    expect(result.created).toBe(0)
    expect(result.skipped).toBe(1)
    expect(result.errors[0]).toContain('professor insert failed')
  })

  it('throws 404 when updateUser target user does not exist', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)

    const service = new UserApplicationService('secret')
    await expect(service.updateUser(9, { name: 'X' })).rejects.toMatchObject({
      status: 404,
      payload: { error: 'User not found' },
    })
  })

  it('throws 409 when updateUser receives an already used email', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 9, email: 'old@example.com' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 10 }]) as any)

    const service = new UserApplicationService('secret')
    await expect(service.updateUser(9, { email: 'taken@example.com' })).rejects.toMatchObject({
      status: 409,
      payload: { error: 'Email already in use' },
    })
  })

  it('updates user and returns updated payload', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 9, email: 'old@example.com' }]) as any)
      .mockReturnValueOnce(createLimitChain([]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 9, name: 'New', surname: 'S', email: 'new@example.com', biography: null, role: 'student', registrationDate: new Date() }]) as any)
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    } as any)

    const service = new UserApplicationService('secret')
    const result = await service.updateUser(9, { name: 'New', email: 'new@example.com' })

    expect(result.user?.email).toBe('new@example.com')
  })

  it('updates user when email is unchanged and biography/surname are provided', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 9, email: 'same@example.com' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 9, name: 'N', surname: 'Updated', email: 'same@example.com', biography: 'Bio', role: 'student', registrationDate: new Date() }]) as any)

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    } as any)

    const service = new UserApplicationService('secret')
    const result = await service.updateUser(9, { email: 'same@example.com', surname: 'Updated', biography: 'Bio' })

    expect(result.user?.surname).toBe('Updated')
    expect(result.user?.biography).toBe('Bio')
  })

  it('throws 404 when deleteUser target does not exist', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)

    const service = new UserApplicationService('secret')
    await expect(service.deleteUser(4)).rejects.toMatchObject({
      status: 404,
      payload: { error: 'User not found' },
    })
  })

  it('deletes user when user exists', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([{ id: 4 }]) as any)
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const trx = { delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }
      await cb(trx)
    })

    const service = new UserApplicationService('secret')
    const result = await service.deleteUser(4)

    expect(result.message).toBe('User deleted successfully')
  })

  it('returns sorted users list', async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
    } as any)

    const service = new UserApplicationService('secret')
    const result = await service.listUsers()

    expect(result.users).toEqual([{ id: 1 }, { id: 2 }])
  })
})
