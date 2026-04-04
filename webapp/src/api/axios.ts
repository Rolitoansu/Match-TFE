import type { User } from '../context/AuthContext'
import axios from 'axios'
import { getApiBaseUrl } from './baseUrl'

const api = axios.create({
    baseURL: getApiBaseUrl()
})

let handleAuthSuccess: (user: User) => void = () => {}
let handleAuthFailure: (error: Error) => void = () => {}

export function setupHandlers(
    onAuthSuccess: (user: User) => void, 
    onAuthFailure: (error: Error) => void
) {
    handleAuthSuccess = onAuthSuccess
    handleAuthFailure = onAuthFailure
}

api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    }
)

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config

        if (!axios.isAxiosError(error) || error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error)
        }

        if (originalRequest.url?.includes('/auth/refresh')) {
            return Promise.reject(error)
        }

        originalRequest._retry = true
        
        try {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                const { data } = await api.post('/auth/refresh', {}, { withCredentials: true })
                const { access_token, user } = data
                localStorage.setItem('accessToken', access_token)
                handleAuthSuccess(user)

                return api(originalRequest)
            }
        } catch (err) {
            handleAuthFailure(err instanceof Error ? err : new Error('Error during token refresh'))
            return Promise.reject(err)
        }
    }
)

export default api
