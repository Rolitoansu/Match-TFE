import { useContext } from 'react'
import type { AxiosInstance } from 'axios'
import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { createAuthContext, createAuthProvider } from './createAuthContext'

const apiPostMock = vi.fn()

const TestContext = createAuthContext<{ id: number }>()

const TestProvider = createAuthProvider(
  TestContext,
  {
    api: { post: apiPostMock } as unknown as AxiosInstance,
    tokenKey: 'accessToken',
    refreshEndpoint: '/auth/refresh',
    loginEndpoint: '/auth/login',
    logoutEndpoint: '/auth/logout',
    dataKey: 'user',
  },
  { supportsRegister: true }
)

const NoRegisterContext = createAuthContext<{ id: number }>()

const NoRegisterProvider = createAuthProvider(NoRegisterContext, {
  api: { post: apiPostMock } as unknown as AxiosInstance,
  tokenKey: 'accessToken',
  refreshEndpoint: '/auth/refresh',
  loginEndpoint: '/auth/login',
  logoutEndpoint: '/auth/logout',
  dataKey: 'user',
})

let latestContext: any
let consoleErrorSpy: ReturnType<typeof vi.spyOn>

function Consumer() {
  latestContext = useContext(TestContext)

  return (
    <div>
      {latestContext.isLoading ? 'loading' : latestContext.data ? `user:${latestContext.data.id}` : 'empty'}
      {' '}
      {latestContext.register ? 'register' : 'noregister'}
    </div>
  )
}

function NoRegisterConsumer() {
  const context = useContext(NoRegisterContext)

  return <div>{context.register ? 'register' : 'noregister'}</div>
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  vi.restoreAllMocks()
  apiPostMock.mockReset()
  latestContext = undefined
  localStorage.clear()
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

test('loads data from refresh and stores the access token', async () => {
  apiPostMock.mockResolvedValueOnce({
    data: { access_token: 'refresh-token', user: { id: 1 } },
  })

  const screen = await render(
    <TestProvider>
      <Consumer />
    </TestProvider>
  )

  await settle()

  expect(localStorage.getItem('accessToken')).toBe('refresh-token')
  expect(screen.getByText('user:1 register')).toBeInTheDocument()
})

test('login updates the stored token and context data', async () => {
  apiPostMock.mockResolvedValueOnce({
    data: { access_token: 'refresh-token', user: { id: 1 } },
  })

  const screen = await render(
    <TestProvider>
      <Consumer />
    </TestProvider>
  )

  await settle()

  apiPostMock.mockResolvedValueOnce({
    data: { access_token: 'login-token', user: { id: 2 } },
  })

  await latestContext.login('user@example.com', 'secret')
  await settle()

  expect(apiPostMock).toHaveBeenCalledWith(
    '/auth/login',
    { email: 'user@example.com', password: 'secret' },
    { withCredentials: true }
  )
  expect(localStorage.getItem('accessToken')).toBe('login-token')
  expect(screen.getByText('user:2 register')).toBeInTheDocument()
})

test('login failure clears the token and resets context data', async () => {
  apiPostMock.mockResolvedValueOnce({
    data: { access_token: 'refresh-token', user: { id: 1 } },
  })

  const screen = await render(
    <TestProvider>
      <Consumer />
    </TestProvider>
  )

  await settle()

  const loginError = new Error('bad login')
  apiPostMock.mockRejectedValueOnce(loginError)

  await expect(latestContext.login('user@example.com', 'secret')).rejects.toThrow('bad login')
  await settle()

  expect(localStorage.getItem('accessToken')).toBeNull()
  expect(screen.getByText('empty register')).toBeInTheDocument()
})

test('logout clears the stored token and resets context data', async () => {
  apiPostMock.mockResolvedValueOnce({
    data: { access_token: 'refresh-token', user: { id: 1 } },
  })

  const screen = await render(
    <TestProvider>
      <Consumer />
    </TestProvider>
  )

  await settle()
  localStorage.setItem('accessToken', 'refresh-token')

  apiPostMock.mockResolvedValueOnce({ data: {} })

  await latestContext.logout()
  await settle()

  expect(apiPostMock).toHaveBeenCalledWith('/auth/logout', {}, { withCredentials: true })
  expect(localStorage.getItem('accessToken')).toBeNull()
  expect(screen.getByText('empty register')).toBeInTheDocument()
})

test('logout failure still clears the token and logs the error', async () => {
  apiPostMock.mockResolvedValueOnce({
    data: { access_token: 'refresh-token', user: { id: 1 } },
  })

  const screen = await render(
    <TestProvider>
      <Consumer />
    </TestProvider>
  )

  await settle()
  localStorage.setItem('accessToken', 'refresh-token')

  const logoutError = new Error('bad logout')
  apiPostMock.mockRejectedValueOnce(logoutError)

  await latestContext.logout()
  await settle()

  expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', logoutError)
  expect(localStorage.getItem('accessToken')).toBeNull()
  expect(screen.getByText('empty register')).toBeInTheDocument()
})

test('register sends the registration payload when enabled', async () => {
  apiPostMock.mockResolvedValueOnce({
    data: { access_token: 'refresh-token', user: { id: 1 } },
  })

  const screen = await render(
    <TestProvider>
      <Consumer />
    </TestProvider>
  )

  await settle()

  apiPostMock.mockResolvedValueOnce({
    data: { user: { id: 3 } },
  })

  await latestContext.register('new@example.com', 'Name', 'Surname', 'secret')
  await settle()

  expect(apiPostMock).toHaveBeenCalledWith(
    '/user/register',
    { email: 'new@example.com', name: 'Name', surname: 'Surname', password: 'secret' },
    { withCredentials: true }
  )
  expect(screen.getByText('user:3 register')).toBeInTheDocument()
})

test('register failure logs the error and keeps the context empty', async () => {
  apiPostMock.mockResolvedValueOnce({
    data: { access_token: 'refresh-token', user: { id: 1 } },
  })

  const screen = await render(
    <TestProvider>
      <Consumer />
    </TestProvider>
  )

  await settle()

  const registerError = new Error('bad register')
  apiPostMock.mockRejectedValueOnce(registerError)

  await expect(latestContext.register('new@example.com', 'Name', 'Surname', 'secret')).rejects.toThrow('bad register')
  await settle()

  expect(consoleErrorSpy).toHaveBeenCalledWith('Registration error:', registerError)
  expect(screen.getByText('user:1 register')).toBeInTheDocument()
})

test('omits register when support is disabled', async () => {
  apiPostMock.mockResolvedValueOnce({
    data: { access_token: 'refresh-token', user: { id: 1 } },
  })

  const screen = await render(
    <NoRegisterProvider>
      <NoRegisterConsumer />
    </NoRegisterProvider>
  )

  await settle()

  expect(screen.getByText('noregister')).toBeInTheDocument()
})

test('logs unexpected refresh failures and leaves the session empty', async () => {
  apiPostMock.mockRejectedValueOnce(new Error('network down'))

  const screen = await render(
    <TestProvider>
      <Consumer />
    </TestProvider>
  )

  await settle()

  expect(consoleErrorSpy).toHaveBeenCalledWith('Auth check failed:', expect.any(Error))
  expect(screen.getByText('empty register')).toBeInTheDocument()
})