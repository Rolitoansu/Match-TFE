import { Shield, LogOut } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import useAdminAuth from '../hooks/useAdminAuth'

export default function AdminLayout() {
    const { admin, logout } = useAdminAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/admin/login')
    }

    return (
        <div className="flex min-h-svh flex-col bg-gray-50/50">
            <header className="sticky top-0 z-50 w-full bg-white border-b-2 flex justify-between items-center px-6 py-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Shield className="text-primary" size={24} />
                    Match-TFE Admin
                </h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{admin?.email}</span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <LogOut size={16} />
                        Cerrar sesión
                    </button>
                </div>
            </header>

            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    )
}
