import { beforeEach, expect, test, vi } from 'vitest'

const useContextMock = vi.hoisted(() => vi.fn())

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')

  return {
    ...actual,
    useContext: useContextMock,
  }
})

import useAuth from './useAuth'
import useAdminAuth from './useAdminAuth'

beforeEach(() => {
  useContextMock.mockReset()
})

test('useAuth returns the auth context value', () => {
  const contextValue = { user: { id: 1 } }
  useContextMock.mockReturnValue(contextValue)

  expect(useAuth()).toBe(contextValue)
})

test('useAuth throws when the auth context is empty', () => {
  useContextMock.mockReturnValue(null)

  expect(() => useAuth()).toThrow('useAuth must be used within an AuthProvider')
})

test('useAdminAuth returns the admin context value', () => {
  const contextValue = { admin: { email: 'admin@example.com' } }
  useContextMock.mockReturnValue(contextValue)

  expect(useAdminAuth()).toBe(contextValue)
})

test('useAdminAuth throws when the admin context is empty', () => {
  useContextMock.mockReturnValue(null)

  expect(() => useAdminAuth()).toThrow('useAdminAuth must be used within an AdminAuthProvider')
})