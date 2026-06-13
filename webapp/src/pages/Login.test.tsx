import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import type { User } from '../context/AuthContext'
import Login from './Login'

// ─── mocks (npm packages — vi.mock works with node_modules) ───────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const navigateMock = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

// ─── helper: build a complete AuthContext value with a spy login function ──────

function makeAuthValue(
  loginFn: (email: string, password: string) => Promise<void> = vi.fn().mockResolvedValue(undefined),
) {
  return {
    user: null as User | null,
    data: null as User | null,
    isLoading: false,
    login: loginFn,
    logout: vi.fn<[], Promise<void>>().mockResolvedValue(undefined),
    register: vi.fn<[string, string, string, string], Promise<void>>().mockResolvedValue(undefined),
  }
}

function renderLogin(ctx = makeAuthValue()) {
  return render(
    <AuthContext.Provider value={ctx}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

// ─── setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  navigateMock.mockReset()
})

// ─── tests ────────────────────────────────────────────────────────────────────

test('renders the title, email and password labels, and the submit button', async () => {
  const screen = await renderLogin()

  await expect.element(screen.getByText('login.title')).toBeInTheDocument()
  await expect.element(screen.getByText('login.emailLabel')).toBeInTheDocument()
  await expect.element(screen.getByText('login.passwordLabel')).toBeInTheDocument()
  await expect.element(screen.getByRole('button', { name: 'login.submit' })).toBeInTheDocument()
})

test('includes a link to the registration page', async () => {
  const screen = await renderLogin()

  const link = screen.getByRole('link', { name: 'login.registerLink' })
  await expect.element(link).toHaveAttribute('href', '/register')
})

test('calls login with the entered credentials and navigates to home on success', async () => {
  const loginSpy = vi.fn().mockResolvedValue(undefined)
  const screen = await renderLogin(makeAuthValue(loginSpy))

  await screen.getByRole('textbox').first().fill('user@example.com')
  await screen.getByRole('textbox').nth(1).fill('secret123')
  await screen.getByRole('button', { name: 'login.submit' }).click()

  await vi.waitFor(() => {
    expect(loginSpy).toHaveBeenCalledWith('user@example.com', 'secret123')
    expect(navigateMock).toHaveBeenCalledWith('/home')
  })
})

test('displays an error message when login fails', async () => {
  const loginSpy = vi.fn().mockRejectedValue(new Error('bad credentials'))
  const screen = await renderLogin(makeAuthValue(loginSpy))

  await screen.getByRole('textbox').first().fill('user@example.com')
  await screen.getByRole('textbox').nth(1).fill('wrong')
  await screen.getByRole('button', { name: 'login.submit' }).click()

  await expect.element(screen.getByText('login.errorInvalidCredentials')).toBeInTheDocument()
  expect(navigateMock).not.toHaveBeenCalled()
})

test('the submit button is disabled while the login request is in flight', async () => {
  // Never resolves — keeps isLoading=true so the button stays disabled
  const loginSpy = vi.fn().mockReturnValue(new Promise<void>(() => {}))
  const screen = await renderLogin(makeAuthValue(loginSpy))

  await screen.getByRole('textbox').first().fill('user@example.com')
  await screen.getByRole('textbox').nth(1).fill('secret123')
  await screen.getByRole('button', { name: 'login.submit' }).click()

  // While loading, the button shows a spinner — query by role only (no name filter)
  await expect.element(screen.getByRole('button')).toBeDisabled()
})
