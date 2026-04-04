import axios from 'axios'
import { getApiBaseUrl } from './baseUrl'

const adminApi = axios.create({
    baseURL: getApiBaseUrl()
})

adminApi.interceptors.request.use(config => {
    const token = localStorage.getItem('adminAccessToken')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default adminApi
