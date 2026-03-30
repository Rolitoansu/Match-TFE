import axios from 'axios'

const HOST = import.meta.env.VITE_HOST || 'http://localhost'
const PORT = import.meta.env.VITE_API_GATEWAY_PORT || 8000

const adminApi = axios.create({
    baseURL: `${HOST}:${PORT}`
})

adminApi.interceptors.request.use(config => {
    const token = localStorage.getItem('adminAccessToken')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default adminApi
