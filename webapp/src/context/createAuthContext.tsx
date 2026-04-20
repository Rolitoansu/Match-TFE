import { useState, useEffect, createContext, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { isAxiosError } from 'axios'
import type { AxiosInstance } from 'axios'

export interface AuthProviderConfig {
  api: AxiosInstance
  tokenKey: string
  refreshEndpoint: string
  loginEndpoint: string
  logoutEndpoint: string
  dataKey: 'user' | 'admin'
}

export interface AuthProviderOptions {
  supportsRegister?: boolean
}

export function createAuthContext<T>() {
  return createContext<{
    data: T | null
    [key: string]: any
  }>({
    data: null,
  })
}

export function createAuthProvider(
  Context: React.Context<any>,
  config: AuthProviderConfig,
  options: AuthProviderOptions = {}
) {
  return function AuthProvider({ children }: { children?: ReactNode }) {
    const [data, setData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    
    useEffect(() => {
      const checkAuth = async () => {
        try {
          const response = await config.api.post(
            config.refreshEndpoint,
            {},
            { withCredentials: true }
          )
          localStorage.setItem(config.tokenKey, response.data.access_token)
          setData(response.data[config.dataKey])
        } catch (err) {
          setData(null)
          if (!isAxiosError(err) || ![401, 403].includes(err.response?.status ?? 0)) {
            console.error(`Auth check failed:`, err)
          }
        } finally {
          setIsLoading(false)
        }
      }

      checkAuth()
    }, [])

    const login = async (credentials: any) => {
      try {
        const response = await config.api.post(
          config.loginEndpoint,
          credentials,
          { withCredentials: true }
        )
        const { access_token } = response.data
        localStorage.setItem(config.tokenKey, access_token)
        setData(response.data[config.dataKey])
      } catch (error) {
        setData(null)
        localStorage.removeItem(config.tokenKey)
        throw error
      }
    }

    const logout = async () => {
      try {
        await config.api.post(config.logoutEndpoint, {}, { withCredentials: true })
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        localStorage.removeItem(config.tokenKey)
        setData(null)
      }
    }

    const register = options.supportsRegister
      ? async (email: string, name: string, surname: string, password: string) => {
          try {
            const response = await config.api.post(
              '/user/register',
              { email, name, surname, password },
              { withCredentials: true }
            )
            setData(response.data[config.dataKey])
          } catch (error) {
            console.error('Registration error:', error)
            throw error
          }
        }
      : undefined

    const contextValue: any = {
      data,
      login,
      logout,
      isLoading,
      [config.dataKey]: data, // For backwards compatibility: user or admin
    }

    if (register) {
      contextValue.register = register
    }

    return (
      <Context.Provider value={contextValue}>
        {!isLoading && (children ?? <Outlet />)}
      </Context.Provider>
    )
  }
}
