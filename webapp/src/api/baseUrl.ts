const HOST = import.meta.env.VITE_HOST?.trim()
const PORT = import.meta.env.VITE_API_GATEWAY_PORT?.trim()

function removeTrailingSlash(value: string) {
    return value.endsWith('/') ? value.slice(0, -1) : value
}

function hasProtocol(value: string) {
    return /^https?:\/\//i.test(value)
}

function hasExplicitPort(value: string) {
    return /^https?:\/\/[^/]+:\d+(\/.*)?$/i.test(value)
}

function isDefaultPortForProtocol(host: string, port: string) {
    return (host.startsWith('https://') && port === '443') || (host.startsWith('http://') && port === '80')
}

export function getApiBaseUrl() {
    if (!HOST) {
        return 'http://localhost:8000'
    }

    const normalizedHost = removeTrailingSlash(HOST)

    if (!hasProtocol(normalizedHost)) {
        return PORT ? `${normalizedHost}:${PORT}` : normalizedHost
    }

    if (!PORT || hasExplicitPort(normalizedHost) || isDefaultPortForProtocol(normalizedHost, PORT)) {
        return normalizedHost
    }

    const url = new URL(normalizedHost)
    return `${url.protocol}//${url.host}:${PORT}${url.pathname}`
}
