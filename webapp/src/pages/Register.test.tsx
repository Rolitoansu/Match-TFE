import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import type { User } from '../context/AuthContext'
import Register from './Register'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const navigateMock = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

function makeAuthValue(
  registerFn: (
    email: string,
    name: string,
    surname: string,
    password: string,
  ) => Promise<void> = vi.fn().mockResolvedValue(undefined),
) {
  return {
    user: null as User | null,
    data: null as User | null,
    isLoading: false,
    login: vi.fn<[string, string], Promise<void>>().mockResolvedValue(undefined),
    logout: vi.fn<[], Promise<void>>().mockResolvedValue(undefined),
    register: registerFn,
  }
}

function renderRegister(ctx = makeAuthValue()) {
  return render(
    <AuthContext.Provider value={ctx}>
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

async function fillForm(
  screen: Awaited<ReturnType<typeof render>>,
  opts: {
    name?: string
    surname?: string
    email?: string
    password?: string
    repeat?: string
  } = {},
) {
  const {
    name = 'Alice',
    surname = 'Smith',
    email = 'alice@example.com',
    password = 'pass1234',
    repeat = 'pass1234',
  } = opts

  await screen.getByRole('textbox').nth(0).fill(name)
  await screen.getByRole('textbox').nth(1).fill(surname)
  await screen.getByRole('textbox').nth(2).fill(email)
  await screen.getByRole('textbox').nth(3).fill(password)
  await screen.getByRole('textbox').nth(4).fill(repeat)
}

beforeEach(() => {
  navigateMock.mockReset()
})

test('renders the title and a link to the login page', async () => {
  const screen = await renderRegister()

  await expect.element(screen.getByText('register.title')).toBeInTheDocument()
  const link = screen.getByRole('link', { name: 'register.loginLink' })
  await expect.element(link).toHaveAttribute('href', '/login')
})

test('renders all five form fields', async () => {
  const screen = await renderRegister()

  for (let i = 0; i < 5; i++) {
    await expect.element(screen.getByRole('textbox').nth(i)).toBeInTheDocument()
  }
})

test('shows a mismatch error without calling register when passwords differ', async () => {
  const registerSpy = vi.fn()
  const screen = await renderRegister(makeAuthValue(registerSpy))

  await fillForm(screen, { password: 'aaaa', repeat: 'bbbb' })
  await screen.getByRole('button', { name: 'register.submit' }).click()

  await expect.element(screen.getByText('register.errorPasswordsMismatch')).toBeInTheDocument()
  expect(registerSpy).not.toHaveBeenCalled()
})

test('calls register and navigates to home when the form is valid', async () => {
  const registerSpy = vi.fn().mockResolvedValue(undefined)
  const screen = await renderRegister(makeAuthValue(registerSpy))

  await fillForm(screen)
  await screen.getByRole('button', { name: 'register.submit' }).click()

  await vi.waitFor(() => {
    expect(registerSpy).toHaveBeenCalledWith('alice@example.com', 'Alice', 'Smith', 'pass1234')
    expect(navigateMock).toHaveBeenCalledWith('/home')
  })
})

test('shows a generic error message when register throws', async () => {
  const registerSpy = vi.fn().mockRejectedValue(new Error('server error'))
  const screen = await renderRegister(makeAuthValue(registerSpy))

  await fillForm(screen)
  await screen.getByRole('button', { name: 'register.submit' }).click()

  await expect.element(screen.getByText('register.errorCreateAccount')).toBeInTheDocument()
  expect(navigateMock).not.toHaveBeenCalled()
})
