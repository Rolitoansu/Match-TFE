import { beforeEach, describe, expect, test } from 'vitest'
import {
  DEFAULT_FILTERS,
  FILTERS_STORAGE_KEY,
} from '../model/proposalTypes'
import type { Proposal } from '../model/proposalTypes'
import { matchesSelectedTab, parseStoredFilters, sortProposals } from './proposalFilters'

describe('parseStoredFilters', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('returns default filters when nothing is stored', () => {
    expect(parseStoredFilters()).toEqual(DEFAULT_FILTERS)
  })

  test('parses a fully valid stored object', () => {
    const stored = {
      search: 'machine learning',
      selectedTab: 'open',
      onlyInterested: true,
      onlyLikedByMe: true,
      selectedType: 2,
      selectedTag: 'AI',
      sortBy: 'oldest',
    }
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(stored))

    expect(parseStoredFilters()).toEqual(stored)
  })

  test('falls back to default selectedTab when the stored value is unrecognised', () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_FILTERS, selectedTab: 'unknown_tab' }),
    )

    expect(parseStoredFilters().selectedTab).toBe(DEFAULT_FILTERS.selectedTab)
  })

  test('falls back to default sortBy when the stored value is unrecognised', () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_FILTERS, sortBy: 'magic' }),
    )

    expect(parseStoredFilters().sortBy).toBe(DEFAULT_FILTERS.sortBy)
  })

  test('falls back to "all" for selectedType when the value is not a positive integer', () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_FILTERS, selectedType: -5 }),
    )

    expect(parseStoredFilters().selectedType).toBe('all')
  })

  test('returns default filters when the stored JSON is malformed', () => {
    localStorage.setItem(FILTERS_STORAGE_KEY, 'not-valid-json{{')

    expect(parseStoredFilters()).toEqual(DEFAULT_FILTERS)
  })

  test('coerces onlyInterested and onlyLikedByMe to boolean', () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_FILTERS, onlyInterested: 1, onlyLikedByMe: 0 }),
    )

    const result = parseStoredFilters()
    expect(result.onlyInterested).toBe(true)
    expect(result.onlyLikedByMe).toBe(false)
  })
})

describe('matchesSelectedTab', () => {
  test('"all" matches every proposal status', () => {
    expect(matchesSelectedTab('proposed', 'all')).toBe(true)
    expect(matchesSelectedTab('in_progress', 'all')).toBe(true)
    expect(matchesSelectedTab('completed', 'all')).toBe(true)
  })

  test('"open" only matches proposed status', () => {
    expect(matchesSelectedTab('proposed', 'open')).toBe(true)
    expect(matchesSelectedTab('in_progress', 'open')).toBe(false)
    expect(matchesSelectedTab('completed', 'open')).toBe(false)
  })

  test('"in_progress" only matches in_progress status', () => {
    expect(matchesSelectedTab('in_progress', 'in_progress')).toBe(true)
    expect(matchesSelectedTab('proposed', 'in_progress')).toBe(false)
    expect(matchesSelectedTab('completed', 'in_progress')).toBe(false)
  })

  test('"completed" only matches completed status', () => {
    expect(matchesSelectedTab('completed', 'completed')).toBe(true)
    expect(matchesSelectedTab('proposed', 'completed')).toBe(false)
    expect(matchesSelectedTab('in_progress', 'completed')).toBe(false)
  })
})

function makeProposal(overrides: Partial<Proposal>): Proposal {
  return {
    id: 1,
    title: 'Default Title',
    description: '',
    type: 1,
    publicationDate: new Date().toISOString(),
    status: 'proposed',
    creatorName: 'Ana',
    creatorSurname: 'García',
    interestCount: 0,
    likedByCurrentUser: false,
    ...overrides,
  }
}

describe('sortProposals', () => {
  test('"recent" sorts newest publication date first', () => {
    const older = makeProposal({ id: 1, publicationDate: '2024-01-01T00:00:00Z' })
    const newer = makeProposal({ id: 2, publicationDate: '2024-06-01T00:00:00Z' })

    const result = sortProposals([older, newer], 'recent')
    expect(result[0].id).toBe(2)
    expect(result[1].id).toBe(1)
  })

  test('"oldest" sorts oldest publication date first', () => {
    const older = makeProposal({ id: 1, publicationDate: '2024-01-01T00:00:00Z' })
    const newer = makeProposal({ id: 2, publicationDate: '2024-06-01T00:00:00Z' })

    const result = sortProposals([newer, older], 'oldest')
    expect(result[0].id).toBe(1)
    expect(result[1].id).toBe(2)
  })

  test('"most_interested" sorts by descending interest count', () => {
    const low = makeProposal({ id: 1, interestCount: 2 })
    const high = makeProposal({ id: 2, interestCount: 10 })
    const mid = makeProposal({ id: 3, interestCount: 5 })

    const result = sortProposals([low, high, mid], 'most_interested')
    expect(result.map((p) => p.id)).toEqual([2, 3, 1])
  })

  test('"title_asc" sorts alphabetically by title', () => {
    const c = makeProposal({ id: 3, title: 'Zinc study' })
    const a = makeProposal({ id: 1, title: 'Alpha research' })
    const b = makeProposal({ id: 2, title: 'Beta project' })

    const result = sortProposals([c, a, b], 'title_asc')
    expect(result.map((p) => p.id)).toEqual([1, 2, 3])
  })

  test('does not mutate the original array', () => {
    const proposals = [
      makeProposal({ id: 1, title: 'B' }),
      makeProposal({ id: 2, title: 'A' }),
    ]
    const original = [...proposals]
    sortProposals(proposals, 'title_asc')
    expect(proposals).toEqual(original)
  })
})
