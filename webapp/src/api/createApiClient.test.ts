import { beforeEach, expect, test, vi } from 'vitest'

const axiosCreateMock = vi.hoisted(() => vi.fn())
const axiosIsAxiosErrorMock = vi.hoisted(() => vi.fn())

vi.mock('axios', () => ({
  default: {
    create: axiosCreateMock,
    isAxiosError: axiosIsAxiosErrorMock,
  },
  create: axiosCreateMock,
  isAxiosError: axiosIsAxiosErrorMock,
}))

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

function createMockClient() {
  const client = vi.fn(async (request: any) => ({ request, retried: true })) as any

  client.post = vi.fn()
  client.interceptors = {
    request: {
      use: vi.fn(),
    },
    response: {
      use: vi.fn(),
    },
  }

  return client
}

test('attaches bearer token and refreshes expired requests', async () => {
  const client = createMockClient()
  axiosCreateMock.mockReturnValue(client)
  axiosIsAxiosErrorMock.mockImplementation((error: any) => Boolean(error?.isAxiosError))

  const { createApiClient } = await import('./createApiClient')
  const handlers = {
    success: vi.fn(),
    failure: vi.fn(),
  }

  const apiClient = createApiClient('accessToken', handlers)

  expect(apiClient).toBe(client)
  expect(axiosCreateMock).toHaveBeenCalledWith({ baseURL: 'http://localhost:8000' })

  const requestInterceptor = client.interceptors.request.use.mock.calls[0][0]
  localStorage.setItem('accessToken', 'token-123')

  const requestConfig = await requestInterceptor({ headers: {} })

  expect(requestConfig.headers.Authorization).toBe('Bearer token-123')

  const responseRejected = client.interceptors.response.use.mock.calls[0][1]
  client.post.mockResolvedValueOnce({ data: { access_token: 'token-456', user: { id: 7, email: 'user@example.com' } } })
  client.mockResolvedValueOnce({ data: 'retried-request' })

  const retryResult = await responseRejected({
    config: { url: '/users', headers: {} },
    response: { status: 401 },
    isAxiosError: true,
  })

  expect(client.post).toHaveBeenCalledWith('/auth/refresh', {}, { withCredentials: true })
  expect(handlers.success).toHaveBeenCalledWith({ id: 7, email: 'user@example.com' })
  expect(localStorage.getItem('accessToken')).toBe('token-456')
  expect(client).toHaveBeenCalledWith({ url: '/users', headers: {}, _retry: true })
  expect(retryResult).toEqual({ data: 'retried-request' })
})

test('passes through requests without a stored token and non-401 responses', async () => {
  const client = createMockClient()
  axiosCreateMock.mockReturnValue(client)
  axiosIsAxiosErrorMock.mockImplementation((error: any) => Boolean(error?.isAxiosError))

  const { createApiClient } = await import('./createApiClient')
  const handlers = {
    success: vi.fn(),
    failure: vi.fn(),
  }

  createApiClient('accessToken', handlers)

  const requestInterceptor = client.interceptors.request.use.mock.calls[0][0]
  const requestConfig = await requestInterceptor({ headers: {} })

  expect(requestConfig.headers.Authorization).toBeUndefined()

  const responseRejected = client.interceptors.response.use.mock.calls[0][1]
  const non401Error = {
    config: { url: '/projects', headers: {} },
    response: { status: 500 },
    isAxiosError: true,
  }

  await expect(responseRejected(non401Error)).rejects.toBe(non401Error)
  expect(client.post).not.toHaveBeenCalled()
  expect(handlers.failure).not.toHaveBeenCalled()
})

test('refreshes admin sessions and normalizes non-error refresh failures', async () => {
  const client = createMockClient()
  axiosCreateMock.mockReturnValue(client)
  axiosIsAxiosErrorMock.mockImplementation((error: any) => Boolean(error?.isAxiosError))

  const { createApiClient } = await import('./createApiClient')
  const handlers = {
    success: vi.fn(),
    failure: vi.fn(),
  }

  createApiClient('accessToken', handlers)

  const responseRejected = client.interceptors.response.use.mock.calls[0][1]
  client.post.mockResolvedValueOnce({ data: { access_token: 'admin-token', admin: { id: 9, email: 'admin@example.com' } } })
  client.mockResolvedValueOnce({ data: 'admin-retried-request' })

  const retryResult = await responseRejected({
    config: { url: '/admin/data', headers: {} },
    response: { status: 401 },
    isAxiosError: true,
  })

  expect(handlers.success).toHaveBeenCalledWith({ id: 9, email: 'admin@example.com' })
  expect(localStorage.getItem('accessToken')).toBe('admin-token')
  expect(retryResult).toEqual({ data: 'admin-retried-request' })

  client.post.mockRejectedValueOnce('refresh failed')

  const normalizingError = responseRejected({
    config: { url: '/projects', headers: {} },
    response: { status: 401 },
    isAxiosError: true,
  })

  await expect(normalizingError).rejects.toBe('refresh failed')
  expect(handlers.failure).toHaveBeenCalledWith(expect.any(Error))
  expect((handlers.failure.mock.calls[0][0] as Error).message).toBe('Token refresh failed')
})

test('refreshes successfully even when no handlers are provided', async () => {
  const client = createMockClient()
  axiosCreateMock.mockReturnValue(client)
  axiosIsAxiosErrorMock.mockImplementation((error: any) => Boolean(error?.isAxiosError))

  const { createApiClient } = await import('./createApiClient')

  createApiClient('accessToken')

  const responseRejected = client.interceptors.response.use.mock.calls[0][1]
  client.post.mockResolvedValueOnce({ data: { access_token: 'token-999', user: { id: 12, email: 'user@example.com' } } })
  client.mockResolvedValueOnce({ data: 'retried-without-handlers' })

  await expect(responseRejected({
    config: { url: '/profile', headers: {} },
    response: { status: 401 },
    isAxiosError: true,
  })).resolves.toEqual({ data: 'retried-without-handlers' })

  expect(localStorage.getItem('accessToken')).toBe('token-999')
})

test('rejects non-refresh 401 errors after refresh failure and short-circuits refresh requests', async () => {
  const client = createMockClient()
  axiosCreateMock.mockReturnValue(client)
  axiosIsAxiosErrorMock.mockImplementation((error: any) => Boolean(error?.isAxiosError))

  const { createApiClient } = await import('./createApiClient')
  const handlers = {
    success: vi.fn(),
    failure: vi.fn(),
  }

  createApiClient('accessToken', handlers)

  const responseRejected = client.interceptors.response.use.mock.calls[0][1]
  const refreshError = new Error('refresh failed')
  client.post.mockRejectedValueOnce(refreshError)

  await expect(responseRejected({
    config: { url: '/projects', headers: {} },
    response: { status: 401 },
    isAxiosError: true,
  })).rejects.toThrow('refresh failed')

  expect(handlers.failure).toHaveBeenCalledWith(refreshError)

  await expect(responseRejected({
    config: { url: '/auth/refresh', headers: {} },
    response: { status: 401 },
    isAxiosError: true,
  })).rejects.toMatchObject({ config: { url: '/auth/refresh', headers: {} } })
})