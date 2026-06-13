import { beforeEach, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { useProposalFilters } from './useProposalFilters'
import { DEFAULT_FILTERS, FILTERS_STORAGE_KEY } from '../model/proposalTypes'

function FiltersConsumer() {
  const { filters, updateFilter, resetFilters, ensureSelectedTagIsAvailable } = useProposalFilters()

  return (
    <div>
      <span data-testid="search">{filters.search}</span>
      <span data-testid="tab">{filters.selectedTab}</span>
      <span data-testid="tag">{filters.selectedTag}</span>
      <span data-testid="sort">{filters.sortBy}</span>
      <button onClick={() => updateFilter('search', 'react hooks')}>set search</button>
      <button onClick={() => updateFilter('selectedTab', 'in_progress')}>set tab</button>
      <button onClick={() => updateFilter('selectedTag', 'python')}>set tag</button>
      <button onClick={() => resetFilters()}>reset</button>
      <button onClick={() => ensureSelectedTagIsAvailable(['javascript', 'typescript'])}>ensure tags</button>
      <button onClick={() => ensureSelectedTagIsAvailable(['python', 'typescript'])}>ensure tags with python</button>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('useProposalFilters', () => {
  test('initialises with default filters when storage is empty', async () => {
    const screen = await render(<FiltersConsumer />)
    await expect.element(screen.getByTestId('search')).toHaveTextContent('')
    await expect.element(screen.getByTestId('tab')).toHaveTextContent('all')
    await expect.element(screen.getByTestId('sort')).toHaveTextContent('recent')
  })

  test('initialises from persisted filters when storage has valid data', async () => {
    const stored = { ...DEFAULT_FILTERS, search: 'deep learning', selectedTab: 'open' }
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(stored))
    const screen = await render(<FiltersConsumer />)
    await expect.element(screen.getByTestId('search')).toHaveTextContent('deep learning')
    await expect.element(screen.getByTestId('tab')).toHaveTextContent('open')
  })

  test('updateFilter changes only the targeted filter key', async () => {
    const screen = await render(<FiltersConsumer />)
    await screen.getByText('set search').click()
    await expect.element(screen.getByTestId('search')).toHaveTextContent('react hooks')
    await expect.element(screen.getByTestId('tab')).toHaveTextContent('all')
  })

  test('updateFilter persists the new value to localStorage', async () => {
    const screen = await render(<FiltersConsumer />)
    await screen.getByText('set tab').click()
    const stored = JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) ?? '{}')
    expect(stored.selectedTab).toBe('in_progress')
  })

  test('resetFilters restores all values to their defaults', async () => {
    const screen = await render(<FiltersConsumer />)
    await screen.getByText('set search').click()
    await screen.getByText('set tab').click()
    await screen.getByText('reset').click()
    await expect.element(screen.getByTestId('search')).toHaveTextContent('')
    await expect.element(screen.getByTestId('tab')).toHaveTextContent('all')
  })

  test('ensureSelectedTagIsAvailable resets selectedTag when it is absent from the available list', async () => {
    const screen = await render(<FiltersConsumer />)
    await screen.getByText('set tag').click()
    await expect.element(screen.getByTestId('tag')).toHaveTextContent('python')
    await screen.getByText('ensure tags', { exact: true }).click()
    await expect.element(screen.getByTestId('tag')).toHaveTextContent('all')
  })

  test('ensureSelectedTagIsAvailable keeps selectedTag when it is in the available list', async () => {
    const screen = await render(<FiltersConsumer />)
    await screen.getByText('set tag').click()
    await screen.getByText('ensure tags with python').click()
    await expect.element(screen.getByTestId('tag')).toHaveTextContent('python')
  })

  test('ensureSelectedTagIsAvailable is a no-op when selectedTag is already "all"', async () => {
    const screen = await render(<FiltersConsumer />)
    await screen.getByText('ensure tags', { exact: true }).click()
    await expect.element(screen.getByTestId('tag')).toHaveTextContent('all')
  })
})
