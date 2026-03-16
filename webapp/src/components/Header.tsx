import {
  Bell,
  FileText,
  Flame,
  LogOut,
  User,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const items = [
    {
      name: 'Explorar',
      route: '/home',
      icon: Flame,
    },
    {
      name: 'Propuestas',
      route: '/proposals',
      icon: FileText,
    },
    {
      name: 'Perfil',
      route: '/profile',
      icon: User,
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/95 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-6 py-4">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="justify-self-start text-left transition-opacity hover:opacity-80"
        >
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Match-TFE
          </h1>
        </button>

        <nav className="flex items-center justify-center gap-2 rounded-full border border-black/5 bg-slate-100/85 p-1.5 shadow-sm shadow-slate-200/70">
          {items.map((item) => {
            const isActive = location.pathname === item.route || location.pathname.startsWith(item.route + '/')
            const Icon = item.icon

            return (
              <button
                key={item.name}
                type="button"
                className={[
                  'flex min-w-33 shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2.5 transition-all duration-200 active:scale-[0.98]',
                  isActive
                    ? 'bg-white text-primary shadow-sm shadow-slate-300/70'
                    : 'text-slate-500 hover:bg-white/70 hover:text-foreground',
                ].join(' ')}
                onClick={() => navigate(item.route)}
              >
                <Icon
                  size={18}
                  strokeWidth={2.2}
                  className={isActive ? 'text-primary' : 'text-current'}
                />
                <span className={[
                  'text-xs font-black uppercase tracking-[0.12em] transition-colors',
                  isActive ? 'text-primary' : 'text-current',
                ].join(' ')}>
                  {item.name}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-slate-100/85 text-slate-500 transition-colors hover:bg-white hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            title="Cerrar sesión"
            onClick={() => logout().then(() => navigate('/login'))}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-slate-100/85 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="h-px w-full bg-linear-to-r from-transparent via-primary/35 to-transparent" />
    </header>
  )
}