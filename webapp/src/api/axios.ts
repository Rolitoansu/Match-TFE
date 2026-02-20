import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.API_GATEWAY_URL || 'http://localhost:8000'
})

let handleAuthSuccess: (accessToken: string, user: any) => void = () => {}
let handleAuthFailure: (error: Error) => void = () => {}

export function setupHandlers(
    onAuthSuccess: (accessToken: string, user: any) => void, 
    onAuthFailure: (error: Error) => void
) {
    handleAuthSuccess = onAuthSuccess
    handleAuthFailure = onAuthFailure
}

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
                handleAuthSuccess(access_token, user)

                originalRequest.headers.Authorization = `Bearer ${access_token}`
                return api(originalRequest)
            }
        } catch (err) {
            handleAuthFailure(err instanceof Error ? err : new Error('Error during token refresh'))
            return Promise.reject(err)
        }
    }
)

export default api