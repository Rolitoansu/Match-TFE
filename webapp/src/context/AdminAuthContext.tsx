import { useState, useEffect, createContext } from 'react'
import { Outlet } from 'react-router-dom'
import api from '../api/axios'
import { isAxiosError } from 'axios'

export interface AdminUser {
    id: number
    email: string
}

interface AdminAuthContextType {
    admin: AdminUser | null
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

export const AdminAuthContext = createContext<AdminAuthContextType>({} as AdminAuthContextType)

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [admin, setAdmin] = useState<AdminUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await api.post('/admin/auth/refresh', {}, { withCredentials: true })
                localStorage.setItem('adminAccessToken', data.access_token)
                setAdmin(data.admin)
            } catch (err) {
                setAdmin(null)
                localStorage.removeItem('adminAccessToken')
                if (!isAxiosError(err) || (err.response?.status !== 401 && err.response?.status !== 403)) {
                    console.error('Admin auth check failed:', err)
                }
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [])

    const login = async (email: string, password: string) => {
        try {
            const { data } = await api.post('/admin/auth/login', { email, password }, { withCredentials: true })
            setAdmin(data.admin)
            localStorage.setItem('adminAccessToken', data.access_token)
        } catch (error) {
            setAdmin(null)
            localStorage.removeItem('adminAccessToken')
            throw error
        }
    }

    const logout = async () => {
        try {
            await api.post('/admin/auth/logout', {}, { withCredentials: true })
        } catch (error) {
            console.error(error)
        } finally {
            localStorage.removeItem('adminAccessToken')
            setAdmin(null)
        }
    }

    return (
        <AdminAuthContext.Provider value={{ admin, login, logout }}>
            {!loading && (children ?? <Outlet />)}
        </AdminAuthContext.Provider>
    )
}
