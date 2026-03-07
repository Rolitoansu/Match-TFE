import { useState, useEffect, createContext } from 'react'
import api, { setupHandlers } from '../api/axios'
import { isAxiosError } from 'axios'

export interface User {
    id: number
    email: string
    name: string
    surname: string
    registrationDate: string
    biography: string
    interests: string[]
}
interface AuthContextType {
    user: User | null
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    register: (email: string, name: string, surname: string, password: string) => Promise<void>
    loading: boolean
    isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    
    useEffect(() => {
        setupHandlers(
            (userData) => {
                setUser(userData)
            },
            (error) => {
                setUser(null)
                localStorage.removeItem('accessToken')
                console.error('Authentication error:', error)
            }
        )
    }, [])

        useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await api.post('/auth/refresh', {}, { withCredentials: true })
                localStorage.setItem('accessToken', data.access_token)
                setUser(data.user)
            } catch (err) {
                setUser(null)
                if (!isAxiosError(err) || (err.response?.status !== 401 && err.response?.status !== 403)) {
                    throw err
                }
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [])
    
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
            localStorage.setItem('accessToken', data.access_token)
        } catch (error) {
            setUser(null)
            localStorage.removeItem('accessToken')
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
            localStorage.removeItem('accessToken')
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout,
            register,
            loading, 
            isAuthenticated: Boolean(user) 
        }}>
            { !loading && children }
        </AuthContext.Provider>
    )
}