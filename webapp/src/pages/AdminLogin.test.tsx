import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { MemoryRouter } from 'react-router-dom'
import { AdminAuthContext } from '../context/AdminAuthContext'
import type { AdminUser } from '../context/AdminAuthContext'
import AdminLogin from './AdminLogin'

// ─── mocks (npm packages — vi.mock works with node_modules) ───────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const navigateMock = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

// ─── helper: build an AdminAuthContext value with a spy login function ─────────

function makeAdminAuthValue(
  loginFn: (email: string, password: string) => Promise<void> = vi.fn().mockResolvedValue(undefined),
) {
  return {
    admin: null as AdminUser | null,
    data: null as AdminUser | null,
    isLoading: false,
    login: loginFn,
    logout: vi.fn<[], Promise<void>>().mockResolvedValue(undefined),
  }
}

function renderAdminLogin(ctx = makeAdminAuthValue()) {
  return render(
    <AdminAuthContext.Provider value={ctx}>
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    </AdminAuthContext.Provider>,
  )
}

// ─── setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  navigateMock.mockReset()
})

// ─── tests ────────────────────────────────────────────────────────────────────

test('renders the admin login title, email label, password label and submit button', async () => {
  const screen = await renderAdminLogin()

  await expect.element(screen.getByText('admin.login.title')).toBeInTheDocument()
  await expect.element(screen.getByText('admin.login.emailLabel')).toBeInTheDocument()
  await expect.element(screen.getByText('admin.login.passwordLabel')).toBeInTheDocument()
  await expect.element(screen.getByRole('button', { name: 'admin.login.submit' })).toBeInTheDocument()
})

test('calls the admin login function with the entered credentials and navigates to /admin on success', async () => {
  const loginSpy = vi.fn().mockResolvedValue(undefined)
  const screen = await renderAdminLogin(makeAdminAuthValue(loginSpy))

  await screen.getByRole('textbox').first().fill('admin@example.com')
  await screen.getByRole('textbox').nth(1).fill('adminpass')
  await screen.getByRole('button', { name: 'admin.login.submit' }).click()

  await vi.waitFor(() => {
    expect(loginSpy).toHaveBeenCalledWith('admin@example.com', 'adminpass')
    expect(navigateMock).toHaveBeenCalledWith('/admin')
  })
})

test('shows the invalid credentials error when admin login fails', async () => {
  const loginSpy = vi.fn().mockRejectedValue(new Error('forbidden'))
  const screen = await renderAdminLogin(makeAdminAuthValue(loginSpy))

  await screen.getByRole('textbox').first().fill('admin@example.com')
  await screen.getByRole('textbox').nth(1).fill('wrong')
  await screen.getByRole('button', { name: 'admin.login.submit' }).click()

  await expect.element(screen.getByText('admin.login.invalidCredentials')).toBeInTheDocument()
  expect(navigateMock).not.toHaveBeenCalled()
})

test('the submit button is disabled while the login request is in flight', async () => {
  // Never resolves — keeps isLoading=true so the button stays disabled
  const loginSpy = vi.fn().mockReturnValue(new Promise<void>(() => {}))
  const screen = await renderAdminLogin(makeAdminAuthValue(loginSpy))

  await screen.getByRole('textbox').first().fill('admin@example.com')
  await screen.getByRole('textbox').nth(1).fill('adminpass')
  await screen.getByRole('button', { name: 'admin.login.submit' }).click()

  // While loading the button shows a spinner — query by role only (no name filter)
  await expect.element(screen.getByRole('button')).toBeDisabled()
})
