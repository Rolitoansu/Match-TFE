import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import AdministrationRoute from './AdministrationRoute'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { AuthContext } from '../../context/AuthContext'
import { AdminAuthContext } from '../../context/AdminAuthContext'

beforeEach(() => {})

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await new Promise((resolve) => setTimeout(resolve, 0))
}

test('public routes redirect logged in users to home', async () => {
  const screen = await render(
    <AuthContext.Provider value={{ user: { id: 1 } as any, data: null, login: async () => {}, logout: async () => {}, register: async () => {}, isLoading: false }}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>public route</div>} />
          </Route>
          <Route path="/home" element={<div>home route</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )

  await settle()

  expect(screen.getByText('home route')).toBeInTheDocument()
})

test('public routes render nested content for anonymous users', async () => {
  const screen = await render(
    <AuthContext.Provider value={{ user: null, data: null, login: async () => {}, logout: async () => {}, register: async () => {}, isLoading: false }}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>public route</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )

  await settle()

  expect(screen.getByText('public route')).toBeInTheDocument()
})

test('protected routes send anonymous users to login', async () => {
  const screen = await render(
    <AuthContext.Provider value={{ user: null, data: null, login: async () => {}, logout: async () => {}, register: async () => {}, isLoading: false }}>
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<div>protected route</div>} />
          </Route>
          <Route path="/login" element={<div>login route</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )

  await settle()

  expect(screen.getByText('login route')).toBeInTheDocument()
})

test('protected routes render nested content for authenticated users', async () => {
  const screen = await render(
    <AuthContext.Provider value={{ user: { id: 2 } as any, data: null, login: async () => {}, logout: async () => {}, register: async () => {}, isLoading: false }}>
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<div>protected route</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )

  await settle()

  expect(screen.getByText('protected route')).toBeInTheDocument()
})

test('administration routes redirect anonymous admins to the login page', async () => {
  const screen = await render(
    <AdminAuthContext.Provider value={{ admin: null, data: null, login: async () => {}, logout: async () => {}, isLoading: false }}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<AdministrationRoute />}>
            <Route path="/admin" element={<div>admin route</div>} />
          </Route>
          <Route path="/admin/login" element={<div>admin login</div>} />
        </Routes>
      </MemoryRouter>
    </AdminAuthContext.Provider>
  )

  await settle()

  expect(screen.getByText('admin login')).toBeInTheDocument()
})

test('administration routes render nested content for authenticated admins', async () => {
  const screen = await render(
    <AdminAuthContext.Provider value={{ admin: { email: 'admin@example.com' } as any, data: null, login: async () => {}, logout: async () => {}, isLoading: false }}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<AdministrationRoute />}>
            <Route path="/admin" element={<div>admin route</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AdminAuthContext.Provider>
  )

  await settle()

  expect(screen.getByText('admin route')).toBeInTheDocument()
})
