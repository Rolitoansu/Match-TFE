import axios, { type AxiosInstance } from 'axios'
import { getApiBaseUrl } from './baseUrl'

export type ApiHandler<T> = { success: (data: T) => void; failure: (error: Error) => void }

/**
 * Factory function to create axios instances for both user and admin APIs
 * Handles token management and auto-refresh on 401 errors
 */
export function createApiClient(
  tokenKey: string,
  handlers?: ApiHandler<any>
): AxiosInstance {
  const client = axios.create({ baseURL: getApiBaseUrl() })

  client.interceptors.request.use(config => {
    const token = localStorage.getItem(tokenKey)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config

      if (!axios.isAxiosError(error) || error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error)
      }

      if (originalRequest.url?.includes('/refresh')) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          const { data } = await client.post('/auth/refresh', {}, { withCredentials: true })
          const token = data.access_token
          localStorage.setItem(tokenKey, token)
          handlers?.success(data.user || data.admin)
          return client(originalRequest)
        }
      } catch (err) {
        handlers?.failure(err instanceof Error ? err : new Error('Token refresh failed'))
        return Promise.reject(err)
      }
    }
  )

  return client
}
