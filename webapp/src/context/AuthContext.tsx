import { createContext } from 'react'
import { createAuthProvider, type AuthProviderConfig } from './createAuthContext'
import api, { setupHandlers } from '../api/axios'

export interface MatchTFEUser {
  id: number
  email: string
  name: string
  surname: string
  registrationDate: string
  biography: string
  notificationFrequency: 'disabled' | 'daily' | 'weekly' | 'biweekly' | 'monthly'
  notificationReminderHour: number
  interests: string[]
  role: 'student' | 'professor'
}

export type User = MatchTFEUser

interface AuthContextType {
  user: User | null
  data: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, name: string, surname: string, password: string) => Promise<void>
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  data: null,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  isLoading: true,
})

setupHandlers(
  () => {},
  (error: Error) => {
    console.error('Authentication error:', error)
  }
)

const authConfig: AuthProviderConfig = {
  api,
  tokenKey: 'accessToken',
  refreshEndpoint: '/auth/refresh',
  loginEndpoint: '/auth/login',
  logoutEndpoint: '/auth/logout',
  dataKey: 'user',
}

const AuthProviderComponent = createAuthProvider(AuthContext, authConfig, { supportsRegister: true })

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <AuthProviderComponent>{children}</AuthProviderComponent>
}