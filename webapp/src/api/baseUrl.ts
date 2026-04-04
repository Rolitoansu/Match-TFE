const API_URL = import.meta.env.VITE_PUBLIC_API_URL?.trim()

export function getApiBaseUrl() {
    if (!API_URL) {
        return 'http://localhost:8000'
    }

    return API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
}
