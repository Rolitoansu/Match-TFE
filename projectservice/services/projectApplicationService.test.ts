import { beforeEach, describe, expect, it, vi } from 'vitest'
import db from '@match-tfe/db'
import { ProjectApplicationService } from './projectApplicationService'

vi.mock('@match-tfe/db', () => ({
  default: {
    select: vi.fn(),
    insert: vi.fn(),
    transaction: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

function createLimitChain<T>(rows: T[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(rows),
  }
}

function createWhereChain<T>(rows: T[]) {
  return {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(rows),
  }
}

function createProposalListChain<T>(rows: T[]) {
  return {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  }
}

function createOrderChain<T>(rows: T[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(rows),
  }
}

describe('ProjectApplicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws 404 on getProposals when user is not found', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)
    const service = new ProjectApplicationService()

    await expect(service.getProposals('missing@example.com')).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Authenticated user not found or role not supported' },
    })
  })

  it('returns proposals in getProposals for student user', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createProposalListChain([{ id: 11, title: 'T', description: 'D', publicationDate: new Date(), status: 'proposed', studentId: null, tutorId: 9 }]) as any)
      .mockReturnValueOnce(createWhereChain([{ userId: 2, status: 'pending' }]) as any)
      .mockReturnValueOnce(createWhereChain([{ id: 2, name: 'Ana', surname: 'Lopez', email: 'ana@example.com' }]) as any)
      .mockReturnValueOnce(createWhereChain([{ name: 'IA' }]) as any)

    const service = new ProjectApplicationService()
    const result = await service.getProposals('student@example.com')

    expect(result.proposals).toHaveLength(1)
    expect(result.proposals[0].interestCount).toBe(1)
    expect(result.proposals[0].tags).toEqual(['IA'])
  })

  it('throws 404 on getExplore when user is not found', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)
    const service = new ProjectApplicationService()

    await expect(service.getExplore('missing@example.com')).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Authenticated user not found or role not supported' },
    })
  })

  it('returns empty explore when authenticated user has no interests', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createWhereChain([]) as any)

    const service = new ProjectApplicationService()
    const result = await service.getExplore('student@example.com')

    expect(result.viewerRole).toBe('student')
    expect(result.proposals).toEqual([])
  })

  it('returns filtered explore proposals when interests match', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createWhereChain([{ tagId: 10 }]) as any)
      .mockReturnValueOnce(createOrderChain([{ id: 50, title: 'A', description: 'B', publicationDate: new Date(), status: 'proposed', creatorId: 2, creatorName: 'P', creatorSurname: 'Q', creatorBiography: null }]) as any)
      .mockReturnValueOnce(createWhereChain([{ id: 10 }]) as any)
      .mockReturnValueOnce(createLimitChain([]) as any)
      .mockReturnValueOnce(createWhereChain([{ name: 'IA' }]) as any)

    const service = new ProjectApplicationService()
    const result = await service.getExplore('student@example.com')

    expect(result.proposals).toHaveLength(1)
    expect(result.proposals[0].sharedTagsCount).toBe(1)
  })

  it('throws 404 on getProposalById when proposal does not exist', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createWhereChain([]) as any)

    const service = new ProjectApplicationService()

    await expect(service.getProposalById('student@example.com', 77)).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Project proposal not found' },
    })
  })

  it('throws 404 on getProposalById when user is not found', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)

    const service = new ProjectApplicationService()
    await expect(service.getProposalById('missing@example.com', 77)).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Authenticated user not found or role not supported' },
    })
  })

  it('returns proposal details with owner email hidden unless accepted', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 2, role: 'student' }]) as any)
      .mockReturnValueOnce(createWhereChain([{ id: 10, title: 'T', description: 'D', publicationDate: new Date(), status: 'proposed', studentId: null, tutorId: 9 }]) as any)
      .mockReturnValueOnce(createWhereChain([{ name: 'IA' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 9, name: 'Tutor', surname: 'One', email: 'tutor@example.com' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ projectId: 10 }]) as any)

    const service = new ProjectApplicationService()
    const result = await service.getProposalById('student@example.com', 10)

    expect(result.proposal.user?.email).toBe('tutor@example.com')
    expect(result.proposal.tags).toEqual(['IA'])
  })

  it('returns tags list', async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ id: 1, name: 'IA' }]),
    } as any)

    const service = new ProjectApplicationService()
    const result = await service.getTags()

    expect(result.tags).toEqual([{ id: 1, name: 'IA' }])
  })

  it('throws 404 on createProposal when user does not exist', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)
    const service = new ProjectApplicationService()

    await expect(service.createProposal('x@example.com', { title: 'T' })).rejects.toMatchObject({
      status: 404,
      payload: { error: 'User not found' },
    })
  })

  it('throws 400 on createProposal when provided tags are invalid', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const trx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 20 }]),
          }),
        }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ id: 10 }]),
        }),
      }
      await cb(trx)
    })

    const service = new ProjectApplicationService()
    await expect(service.createProposal('s@example.com', { title: 'T', tags: ['IA', 'Cloud'] })).rejects.toMatchObject({
      status: 400,
      payload: { error: 'One or more tags are not allowed' },
    })
  })

  it('creates proposal successfully without tags', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const trx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 20 }]),
          }),
        }),
      }
      await cb(trx)
    })

    const service = new ProjectApplicationService()
    const result = await service.createProposal('s@example.com', { title: 'T' })

    expect(result.message).toBe('Project proposal created successfully')
  })

  it('creates proposal and inserts project tags when valid tags are provided', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const trx = {
        insert: vi
          .fn()
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 20 }]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockResolvedValue(undefined),
          }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ id: 10 }, { id: 20 }]),
        }),
      }
      await cb(trx)
    })

    const service = new ProjectApplicationService()
    const result = await service.createProposal('s@example.com', { title: 'T', tags: ['IA', 'ML'] })

    expect(result.message).toBe('Project proposal created successfully')
  })

  it('throws 404 on renewProposal when user is not found', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)

    const service = new ProjectApplicationService()
    await expect(service.renewProposal('missing@example.com', 5)).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Authenticated user not found or role not supported' },
    })
  })

  it('throws 404 on renewProposal when proposal is not found', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([]) as any)

    const service = new ProjectApplicationService()
    await expect(service.renewProposal('s@example.com', 5)).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Proposal not found' },
    })
  })

  it('throws 403 on renewProposal when requester is not owner', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, studentId: 2, tutorId: null }]) as any)

    const service = new ProjectApplicationService()
    await expect(service.renewProposal('s@example.com', 5)).rejects.toMatchObject({
      status: 403,
      payload: { error: 'Only the owner can renew a proposal' },
    })
  })

  it('renews proposal for owner', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, studentId: 1, tutorId: null }]) as any)
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    } as any)

    const service = new ProjectApplicationService()
    const result = await service.renewProposal('s@example.com', 5)

    expect(result.publicationDate).toBeInstanceOf(Date)
    expect(result.expiresAt).toBeInstanceOf(Date)
  })

  it('throws 404 on likeProposal when user is not found', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)

    const service = new ProjectApplicationService()
    await expect(service.likeProposal('missing@example.com', 5)).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Authenticated user not found or role not supported' },
    })
  })

  it('throws 400 on likeProposal when liking own proposal', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, studentId: 1, tutorId: null, status: 'proposed' }]) as any)

    const service = new ProjectApplicationService()
    await expect(service.likeProposal('s@example.com', 5)).rejects.toMatchObject({
      status: 400,
      payload: { error: 'You cannot like your own proposal' },
    })
  })

  it('returns liked result on likeProposal success', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, studentId: null, tutorId: 9, status: 'proposed' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ status: 'pending' }]) as any)
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const trx = {
        select: vi
          .fn()
          .mockReturnValueOnce(createLimitChain([]))
          .mockReturnValueOnce(createLimitChain([])),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }),
      }
      await cb(trx)
    })

    const service = new ProjectApplicationService()
    const result = await service.likeProposal('s@example.com', 5)

    expect(result.liked).toBe(true)
    expect(result.matchStatus).toBe('pending')
  })

  it('throws 404 on likeProposal when proposal is unavailable', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, studentId: null, tutorId: 9, status: 'completed' }]) as any)

    const service = new ProjectApplicationService()
    await expect(service.likeProposal('s@example.com', 5)).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Proposal not available for likes' },
    })
  })

  it('throws 400 on likeProposal when owner is missing', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, studentId: null, tutorId: null, status: 'proposed' }]) as any)

    const service = new ProjectApplicationService()
    await expect(service.likeProposal('s@example.com', 5)).rejects.toMatchObject({
      status: 400,
      payload: { error: 'Proposal owner not found' },
    })
  })

  it('throws 400 on likeProposal when owner role is equal to requester role', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, studentId: 2, tutorId: null, status: 'proposed' }]) as any)

    const service = new ProjectApplicationService()
    await expect(service.likeProposal('s@example.com', 5)).rejects.toMatchObject({
      status: 400,
      payload: { error: 'Only proposals from the opposite role can be liked' },
    })
  })

  it('throws 409 on likeProposal when an accepted match already exists', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, studentId: null, tutorId: 9, status: 'proposed' }]) as any)
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const trx = {
        select: vi.fn().mockReturnValueOnce(createLimitChain([{ projectId: 5 }])),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }),
      }
      await cb(trx)
    })

    const service = new ProjectApplicationService()
    await expect(service.likeProposal('s@example.com', 5)).rejects.toMatchObject({
      status: 409,
      payload: { error: 'This proposal already has an accepted match' },
    })
  })

  it('uses update branch in likeProposal when interaction exists and is not accepted', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, studentId: null, tutorId: 9, status: 'proposed' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ status: 'pending' }]) as any)
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const trx = {
        select: vi
          .fn()
          .mockReturnValueOnce(createLimitChain([]))
          .mockReturnValueOnce(createLimitChain([{ status: 'rejected' }])),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }),
      }
      await cb(trx)
    })

    const service = new ProjectApplicationService()
    const result = await service.likeProposal('s@example.com', 5)

    expect(result.liked).toBe(true)
  })

  it('throws 404 on acceptProposalMatch when user is not found', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)

    const service = new ProjectApplicationService()
    await expect(service.acceptProposalMatch('missing@example.com', 5, 2)).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Authenticated user not found or role not supported' },
    })
  })

  it('accepts proposal match successfully', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, status: 'proposed', studentId: 1, tutorId: null }]) as any)
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const trx = {
        select: vi
          .fn()
          .mockReturnValueOnce(createLimitChain([]))
          .mockReturnValueOnce(createLimitChain([{ userId: 2 }])),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }),
      }
      await cb(trx)
    })

    const service = new ProjectApplicationService()
    const result = await service.acceptProposalMatch('s@example.com', 5, 2)

    expect(result.accepted).toBe(true)
    expect(result.userId).toBe(2)
  })

  it('throws 404 on acceptProposalMatch when proposal is missing', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([]) as any)

    const service = new ProjectApplicationService()
    await expect(service.acceptProposalMatch('s@example.com', 5, 2)).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Proposal not found' },
    })
  })

  it('throws 403 on acceptProposalMatch when requester is not owner', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, status: 'proposed', studentId: 2, tutorId: null }]) as any)

    const service = new ProjectApplicationService()
    await expect(service.acceptProposalMatch('s@example.com', 5, 2)).rejects.toMatchObject({
      status: 403,
      payload: { error: 'Only the owner can accept a match' },
    })
  })

  it('throws 409 on acceptProposalMatch when proposal is not in proposed status', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, status: 'completed', studentId: 1, tutorId: null }]) as any)

    const service = new ProjectApplicationService()
    await expect(service.acceptProposalMatch('s@example.com', 5, 2)).rejects.toMatchObject({
      status: 409,
      payload: { error: 'Proposal is not available for new matches' },
    })
  })

  it('throws 409 on acceptProposalMatch when accepted match already exists', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, status: 'proposed', studentId: 1, tutorId: null }]) as any)
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const trx = {
        select: vi.fn().mockReturnValueOnce(createLimitChain([{ userId: 9 }])),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }),
      }
      await cb(trx)
    })

    const service = new ProjectApplicationService()
    await expect(service.acceptProposalMatch('s@example.com', 5, 2)).rejects.toMatchObject({
      status: 409,
      payload: { error: 'This proposal already has an accepted match' },
    })
  })

  it('throws 404 on acceptProposalMatch when pending like is missing', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, status: 'proposed', studentId: 1, tutorId: null }]) as any)
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const trx = {
        select: vi
          .fn()
          .mockReturnValueOnce(createLimitChain([]))
          .mockReturnValueOnce(createLimitChain([])),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }),
      }
      await cb(trx)
    })

    const service = new ProjectApplicationService()
    await expect(service.acceptProposalMatch('s@example.com', 5, 2)).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Pending like not found for this user' },
    })
  })

  it('passes proposal successfully', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, studentId: null, tutorId: 2, status: 'proposed' }]) as any)
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const trx = {
        select: vi.fn().mockReturnValue(createLimitChain([])),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }),
      }
      await cb(trx)
    })

    const service = new ProjectApplicationService()
    const result = await service.passProposal('s@example.com', 5)

    expect(result.passed).toBe(true)
  })

  it('throws 404 on passProposal when user is not found', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)

    const service = new ProjectApplicationService()
    await expect(service.passProposal('missing@example.com', 5)).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Authenticated user not found or role not supported' },
    })
  })

  it('throws 404 on passProposal when proposal is unavailable', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, studentId: null, tutorId: 2, status: 'completed' }]) as any)

    const service = new ProjectApplicationService()
    await expect(service.passProposal('s@example.com', 5)).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Proposal not available' },
    })
  })

  it('throws 400 on passProposal when direction is invalid', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, studentId: 3, tutorId: null, status: 'proposed' }]) as any)

    const service = new ProjectApplicationService()
    await expect(service.passProposal('s@example.com', 5)).rejects.toMatchObject({
      status: 400,
      payload: { error: 'This proposal is not from the opposite role' },
    })
  })

  it('uses update branch in passProposal when interaction already exists', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(createLimitChain([{ id: 1, role: 'student' }]) as any)
      .mockReturnValueOnce(createLimitChain([{ id: 5, studentId: null, tutorId: 2, status: 'proposed' }]) as any)
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const trx = {
        select: vi.fn().mockReturnValue(createLimitChain([{ status: 'pending' }])),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }),
      }
      await cb(trx)
    })

    const service = new ProjectApplicationService()
    const result = await service.passProposal('s@example.com', 5)

    expect(result.passed).toBe(true)
  })

  it('lists admin tags', async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([{ id: 1, name: 'IA' }]),
    } as any)

    const service = new ProjectApplicationService()
    const result = await service.listAdminTags()

    expect(result.tags).toEqual([{ id: 1, name: 'IA' }])
  })

  it('throws 400 when createAdminTag receives empty name', async () => {
    const service = new ProjectApplicationService()

    await expect(service.createAdminTag('   ')).rejects.toMatchObject({
      status: 400,
      payload: { error: 'Tag name is required' },
    })
  })

  it('throws 409 when createAdminTag already exists', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([{ id: 2 }]) as any)

    const service = new ProjectApplicationService()

    await expect(service.createAdminTag('IA')).rejects.toMatchObject({
      status: 409,
      payload: { error: 'Tag already exists' },
    })
  })

  it('returns created tag when createAdminTag succeeds', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 7, name: 'IA' }]),
      }),
    } as any)

    const service = new ProjectApplicationService()
    const result = await service.createAdminTag(' IA ')

    expect(result.tag).toEqual({ id: 7, name: 'IA' })
  })

  it('imports admin tags handling empty, existing and created tags', async () => {
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
      const trx = {
        select: vi
          .fn()
          .mockReturnValueOnce(createLimitChain([]))
          .mockReturnValueOnce(createLimitChain([{ id: 1 }]))
          .mockReturnValueOnce(createLimitChain([])),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
      }
      await cb(trx)
    })

    const service = new ProjectApplicationService()
    const result = await service.importAdminTags([{ name: ' ' }, { name: 'IA' }, { name: 'ML' }])

    expect(result.created).toBe(1)
    expect(result.skipped).toBe(2)
  })

  it('throws 404 when deleting missing admin tag', async () => {
    vi.mocked(db.delete).mockReturnValueOnce({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    } as any)

    const service = new ProjectApplicationService()
    await expect(service.deleteAdminTag(4)).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Tag not found' },
    })
  })

  it('deletes admin tag successfully', async () => {
    vi.mocked(db.delete).mockReturnValueOnce({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 4 }]),
      }),
    } as any)

    const service = new ProjectApplicationService()
    const result = await service.deleteAdminTag(4)

    expect(result.message).toBe('Tag deleted')
  })

  it('throws 400 when updateAdminTag receives empty name', async () => {
    const service = new ProjectApplicationService()
    await expect(service.updateAdminTag(2, '   ')).rejects.toMatchObject({
      status: 400,
      payload: { error: 'Tag name cannot be empty' },
    })
  })

  it('throws 409 when updateAdminTag name is already used by another tag', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([{ id: 9 }]) as any)

    const service = new ProjectApplicationService()
    await expect(service.updateAdminTag(2, 'IA')).rejects.toMatchObject({
      status: 409,
      payload: { error: 'A tag with this name already exists' },
    })
  })

  it('throws 404 when updateAdminTag target does not exist', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)
    vi.mocked(db.update).mockReturnValueOnce({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as any)

    const service = new ProjectApplicationService()
    await expect(service.updateAdminTag(2, 'IA')).rejects.toMatchObject({
      status: 404,
      payload: { error: 'Tag not found' },
    })
  })

  it('updates admin tag successfully', async () => {
    vi.mocked(db.select).mockReturnValueOnce(createLimitChain([]) as any)
    vi.mocked(db.update).mockReturnValueOnce({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 2, name: 'IA' }]),
        }),
      }),
    } as any)

    const service = new ProjectApplicationService()
    const result = await service.updateAdminTag(2, ' IA ')

    expect(result.tag).toEqual({ id: 2, name: 'IA' })
  })
})
