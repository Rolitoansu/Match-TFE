import { useState, useEffect, useContext, createContext } from 'react'
import axios, { HttpStatusCode } from 'axios'
import api, { setupHandlers } from '../api/axios'

interface AuthContextType {
    user: any
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    register: (email: string, name: string, surname: string, password: string) => Promise<void>
    authApi: (config: any) => Promise<any>
    loading: boolean
    isAuthenticated: boolean
}

interface User {
    email: string
    name: string
    surname: string
    registrationDate: string
    biography: string
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    
    useEffect(() => {
        setupHandlers(
            (token, userData) => {
                setAccessToken(token)
                setUser(userData)
            },
            (error) => {
                setAccessToken(null)
                setUser(null)
                console.error('Authentication error:', error)
            }
        )
    }, [])

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await api.post('/auth/refresh', {}, { withCredentials: true })
                setAccessToken(data.access_token)
                setUser(data.user)
            } catch (err) {
                setUser(null)
                if (axios.isAxiosError(err)) {
                    const status = err.response?.status
                    if (status !== HttpStatusCode.Unauthorized && status !== HttpStatusCode.Forbidden) {
                        throw err
                    }
                } else {
                    throw err
                }
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [])

    const authApi = async (config: any) => {
        return api({
            ...config,
            headers: {
                ...config.headers,
                Authorization: `Bearer ${accessToken}`
            }
        })
    }
    
    const register = async (email: string, name: string, surname: string, password: string) => {
        try {
            const { data } = await api.post('/user/register', { email, name, surname, password }, { withCredentials: true })
            setUser(data.user)
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    const login = async (email: string, password: string) => {
        try {
            const { data } = await api.post('/auth/login', { email, password }, { withCredentials: true })
            setUser(data.user)
            setAccessToken(data.access_token)
        } catch (error) {
            setUser(null)
            setAccessToken(null)
            console.error(error)
            throw error
        }
    }

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } catch (error) {
            console.error(error)
        } finally {
            setAccessToken(null)
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout,
            register,
            authApi,
            loading, 
            isAuthenticated: Boolean(user) 
        }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}