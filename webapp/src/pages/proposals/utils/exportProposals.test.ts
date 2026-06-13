import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { Proposal } from '../model/proposalTypes'

const generatePDFMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('./generatePDF', () => ({
  generateProposalsPDF: generatePDFMock,
}))

function makeProposal(overrides: Partial<Proposal> = {}): Proposal {
  return {
    id: 1,
    title: 'Test Proposal',
    description: 'A short description',
    type: 1,
    publicationDate: '2024-01-15T00:00:00Z',
    status: 'proposed',
    creatorName: 'Laura',
    creatorSurname: 'Martínez',
    interestCount: 3,
    likedByCurrentUser: false,
    tags: ['machine learning', 'python'],
    ...overrides,
  }
}

import { exportToCSV, exportToPDF } from './exportProposals'

describe('exportToCSV', () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/fake')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('does nothing when passed an empty array', () => {
    exportToCSV([], 'propuestas.csv')
    expect(createObjectURLSpy).not.toHaveBeenCalled()
  })

  test('creates a blob and initiates a download for a non-empty list', () => {
    exportToCSV([makeProposal()], 'propuestas.csv')
    expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob))
  })

  test('the generated blob contains the proposal title', async () => {
    let capturedBlob: Blob | undefined
    createObjectURLSpy.mockImplementation((blob: Blob) => {
      capturedBlob = blob
      return 'blob:http://localhost/fake'
    })

    exportToCSV([makeProposal({ title: 'Unique CSV Title' })], 'out.csv')

    const text = await capturedBlob!.text()
    expect(text).toContain('Unique CSV Title')
  })

  test('the generated blob includes a header row with the expected columns', async () => {
    let capturedBlob: Blob | undefined
    createObjectURLSpy.mockImplementation((blob: Blob) => {
      capturedBlob = blob
      return 'blob:http://localhost/fake'
    })

    exportToCSV([makeProposal()], 'out.csv')

    const text = await capturedBlob!.text()
    expect(text).toContain('Título')
    expect(text).toContain('Estado')
    expect(text).toContain('Etiquetas')
  })
})

describe('exportToPDF', () => {
  test.skip(
    'delegates to generateProposalsPDF with the given proposals and file name',
    async () => {
    },
  )
})
