import { beforeEach, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { useFavorites } from './useFavorites'

const FAVORITES_KEY = 'match-tfe.favorites'

function FavoritesConsumer({ proposalId }: { proposalId: number }) {
  const { isFavorite, toggleFavorite, addFavorite, removeFavorite, favorites } = useFavorites()

  return (
    <div>
      <span data-testid="count">{favorites.length}</span>
      <span data-testid="is-fav">{isFavorite(proposalId) ? 'yes' : 'no'}</span>
      <button onClick={() => toggleFavorite(proposalId)}>toggle</button>
      <button onClick={() => addFavorite(proposalId)}>add</button>
      <button onClick={() => removeFavorite(proposalId)}>remove</button>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('useFavorites', () => {
  test('starts with an empty favorites list when storage is empty', async () => {
    const screen = await render(<FavoritesConsumer proposalId={1} />)
    await expect.element(screen.getByTestId('count')).toHaveTextContent('0')
    await expect.element(screen.getByTestId('is-fav')).toHaveTextContent('no')
  })

  test('loads persisted favorites from localStorage on mount', async () => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([42, 99]))
    const screen = await render(<FavoritesConsumer proposalId={42} />)
    await expect.element(screen.getByTestId('count')).toHaveTextContent('2')
    await expect.element(screen.getByTestId('is-fav')).toHaveTextContent('yes')
  })

  test('toggleFavorite adds an id that is not yet in the list', async () => {
    const screen = await render(<FavoritesConsumer proposalId={7} />)
    await screen.getByText('toggle').click()
    await expect.element(screen.getByTestId('is-fav')).toHaveTextContent('yes')
    await expect.element(screen.getByTestId('count')).toHaveTextContent('1')
  })

  test('toggleFavorite removes an id that is already in the list', async () => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([7]))
    const screen = await render(<FavoritesConsumer proposalId={7} />)
    await screen.getByText('toggle').click()
    await expect.element(screen.getByTestId('is-fav')).toHaveTextContent('no')
    await expect.element(screen.getByTestId('count')).toHaveTextContent('0')
  })

  test('addFavorite adds a new id to the list', async () => {
    const screen = await render(<FavoritesConsumer proposalId={5} />)
    await screen.getByText('add').click()
    await expect.element(screen.getByTestId('is-fav')).toHaveTextContent('yes')
  })

  test('addFavorite is idempotent when the id is already present', async () => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([5]))
    const screen = await render(<FavoritesConsumer proposalId={5} />)
    await screen.getByText('add').click()
    await expect.element(screen.getByTestId('count')).toHaveTextContent('1')
  })

  test('removeFavorite removes an existing id from the list', async () => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([5, 10]))
    const screen = await render(<FavoritesConsumer proposalId={5} />)
    await screen.getByText('remove').click()
    await expect.element(screen.getByTestId('is-fav')).toHaveTextContent('no')
    await expect.element(screen.getByTestId('count')).toHaveTextContent('1')
  })

  test('removeFavorite is a no-op when the id does not exist', async () => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([10]))
    const screen = await render(<FavoritesConsumer proposalId={5} />)
    await screen.getByText('remove').click()
    await expect.element(screen.getByTestId('count')).toHaveTextContent('1')
  })

  test('persists favorites to localStorage after a toggle', async () => {
    const screen = await render(<FavoritesConsumer proposalId={3} />)
    await screen.getByText('toggle').click()
    const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]')
    expect(stored).toContain(3)
  })

  test('treats an invalid JSON value in storage as an empty list', async () => {
    localStorage.setItem(FAVORITES_KEY, 'not-valid-json')
    const screen = await render(<FavoritesConsumer proposalId={1} />)
    await expect.element(screen.getByTestId('count')).toHaveTextContent('0')
  })
})
