import { Shield, LogOut } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import useAdminAuth from '../hooks/useAdminAuth'
import { useTranslation } from 'react-i18next'

export default function AdminLayout() {
    const { t } = useTranslation()
    const { admin, logout } = useAdminAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/admin/login')
    }

    return (
        <div className="flex min-h-svh flex-col bg-gray-50/50">
            <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/95 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
                    <button
                        type="button"
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-2 transition-opacity hover:opacity-80"
                    >
                        <Shield className="text-primary" size={20} />
                        <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-2xl">
                            Match-TFE <span className="text-primary">Admin</span>
                        </h1>
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="mr-2 hidden text-sm text-muted-foreground sm:inline">{admin?.email}</span>
                        <button
                            type="button"
                            title={t('admin.layout.signOut')}
                            onClick={handleLogout}
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-slate-100/85 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div className="h-px w-full bg-linear-to-r from-transparent via-primary/35 to-transparent" />
            </header>

            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    )
}
