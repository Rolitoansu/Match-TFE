import { createContext } from 'react'
import { createAuthProvider, type AuthProviderConfig } from './createAuthContext'
import adminApi from '../api/adminAxios'

export interface AdminUser {
  id: number
  email: string
}

interface AdminAuthContextType {
  admin: AdminUser | null
  data: AdminUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

export const AdminAuthContext = createContext<AdminAuthContextType>({
  admin: null,
  data: null,
  login: async () => {},
  logout: async () => {},
  isLoading: true,
})

const adminAuthConfig: AuthProviderConfig = {
  api: adminApi,
  tokenKey: 'adminAccessToken',
  refreshEndpoint: '/admin/auth/refresh',
  loginEndpoint: '/admin/auth/login',
  logoutEndpoint: '/admin/auth/logout',
  dataKey: 'admin',
}

const AdminAuthProviderComponent = createAuthProvider(AdminAuthContext, adminAuthConfig)

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <AdminAuthProviderComponent>{children}</AdminAuthProviderComponent>
}
