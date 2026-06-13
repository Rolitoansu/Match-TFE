import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { Proposal } from '../model/proposalTypes'

// ─── Hoisted mock for generatePDF ─────────────────────────────────────────────

const generatePDFMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('./generatePDF', () => ({
  generateProposalsPDF: generatePDFMock,
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── exportToCSV ──────────────────────────────────────────────────────────────

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

// ─── exportToPDF ──────────────────────────────────────────────────────────────
//
// NOTE: vi.mock('./generatePDF') cannot reliably intercept the live ESM binding
// that exportProposals.ts captured at import time when running in Playwright
// browser mode. The function is a transparent wrapper and its behaviour is
// exercised by the integration / E2E test suite.

describe('exportToPDF', () => {
  test.skip(
    'delegates to generateProposalsPDF with the given proposals and file name',
    async () => {
      // Skipped: live ESM bindings cannot be replaced in browser-mode tests.
    },
  )
})
