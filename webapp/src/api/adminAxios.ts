import axios from 'axios'

const adminApi = axios.create({
    baseURL: import.meta.env.API_GATEWAY_URL || 'http://localhost:8000'
})

adminApi.interceptors.request.use(config => {
    const token = localStorage.getItem('adminAccessToken')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default adminApi
