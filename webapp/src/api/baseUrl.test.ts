import { beforeEach, expect, test, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
})

test('falls back to localhost when the public api url is missing', async () => {
  vi.stubEnv('VITE_PUBLIC_API_URL', '')

  const { getApiBaseUrl } = await import('./baseUrl')

  expect(getApiBaseUrl()).toBe('http://localhost:8000')
})

test('trims trailing slashes from the configured public api url', async () => {
  vi.stubEnv('VITE_PUBLIC_API_URL', 'https://api.example.com/')

  const { getApiBaseUrl } = await import('./baseUrl')

  expect(getApiBaseUrl()).toBe('https://api.example.com')
})

test('returns the configured public api url when it already has no trailing slash', async () => {
  vi.stubEnv('VITE_PUBLIC_API_URL', 'https://api.example.com')

  const { getApiBaseUrl } = await import('./baseUrl')

  expect(getApiBaseUrl()).toBe('https://api.example.com')
})