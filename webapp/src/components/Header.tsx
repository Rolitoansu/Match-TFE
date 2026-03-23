import {
  Bell,
  Trash2,
  FileText,
  Flame,
  LogOut,
  User,
  Languages,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { clearNotifications, deleteNotification, fetchNotifications, markNotificationAsRead, type NotificationItem } from '../api/notifications'
import useAuth from '../hooks/useAuth'
import { useTranslation } from 'react-i18next'

export const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()
  const { t, i18n } = useTranslation()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [clearingNotifications, setClearingNotifications] = useState(false)
  const [deletingNotificationId, setDeletingNotificationId] = useState<number | null>(null)
  const notificationPanelRef = useRef<HTMLDivElement | null>(null)

  const items = [
    {
      name: t('header.nav.explore'),
      route: '/home',
      icon: Flame,
    },
    {
      name: t('header.nav.proposals'),
      route: '/proposals',
      icon: FileText,
    },
    {
      name: t('header.nav.profile'),
      route: '/profile',
      icon: User,
    },
  ]

  const currentLanguage = i18n.resolvedLanguage?.startsWith('es') ? 'es' : 'en'

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    const loadNotifications = async () => {
      try {
        setLoadingNotifications(true)
        const data = await fetchNotifications()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        setLoadingNotifications(false)
      }
    }

    void loadNotifications()
  }, [user])

  useEffect(() => {
    if (!isNotificationsOpen) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!notificationPanelRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isNotificationsOpen])

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (notification.read) {
      return
    }

    setNotifications((currentNotifications) => currentNotifications.map((currentNotification) =>
      currentNotification.id === notification.id
        ? { ...currentNotification, read: true }
        : currentNotification
    ))
    setUnreadCount((currentUnreadCount) => Math.max(currentUnreadCount - 1, 0))

    try {
      await markNotificationAsRead(notification.id)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const toggleNotifications = async () => {
    const nextOpenState = !isNotificationsOpen
    setIsNotificationsOpen(nextOpenState)

    if (nextOpenState) {
      try {
        const data = await fetchNotifications()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      } catch (error) {
        console.error('Error reloading notifications:', error)
      }
    }
  }

  const handleClearNotifications = async () => {
    if (notifications.length === 0 || clearingNotifications) {
      return
    }

    setClearingNotifications(true)

    try {
      await clearNotifications()
      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error('Error clearing notifications:', error)
    } finally {
      setClearingNotifications(false)
    }
  }

  const handleDeleteNotification = async (notification: NotificationItem) => {
    if (deletingNotificationId !== null) {
      return
    }

    const wasUnread = !notification.read

    setDeletingNotificationId(notification.id)
    setNotifications((currentNotifications) => currentNotifications.filter((currentNotification) => currentNotification.id !== notification.id))

    if (wasUnread) {
      setUnreadCount((currentUnreadCount) => Math.max(currentUnreadCount - 1, 0))
    }

    try {
      await deleteNotification(notification.id)
    } catch (error) {
      console.error('Error deleting notification:', error)

      try {
        const data = await fetchNotifications()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      } catch (reloadError) {
        console.error('Error reloading notifications after delete failure:', reloadError)
      }
    } finally {
      setDeletingNotificationId(null)
    }
  }

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

        <div className="relative flex items-center justify-end gap-2" ref={notificationPanelRef}>
          <label className="relative">
            <span className="sr-only">Language</span>
            <Languages className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={currentLanguage}
              onChange={(event) => {
                void i18n.changeLanguage(event.target.value)
              }}
              className="h-11 rounded-full border border-black/5 bg-slate-100/85 pl-9 pr-8 text-xs font-bold uppercase tracking-[0.08em] text-slate-600 transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Language"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void toggleNotifications()}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-slate-100/85 text-slate-500 transition-colors hover:bg-white hover:text-foreground"
            title={t('header.notifications.title')}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {isNotificationsOpen && (
            <div className="absolute right-0 top-14 z-40 w-80 rounded-2xl border border-black/10 bg-white p-3 shadow-xl shadow-slate-300/60">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-sm font-semibold text-foreground">{t('header.notifications.title')}</p>
                <button
                  type="button"
                  onClick={() => void handleClearNotifications()}
                  disabled={clearingNotifications || notifications.length === 0}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-foreground disabled:opacity-50"
                >
                  {clearingNotifications ? t('header.notifications.clearing') : t('header.notifications.clear')}
                </button>
              </div>

              <div className="max-h-80 space-y-1 overflow-y-auto">
                {loadingNotifications && (
                  <p className="px-2 py-3 text-sm text-slate-500">{t('common.loading')}</p>
                )}

                {!loadingNotifications && notifications.length === 0 && (
                  <p className="px-2 py-3 text-sm text-slate-500">{t('header.notifications.empty')}</p>
                )}

                {!loadingNotifications && notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={[
                      'flex items-start gap-2 rounded-xl px-2 py-2 transition-colors',
                      notification.read
                        ? 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        : 'bg-primary/8 text-foreground hover:bg-primary/12',
                    ].join(' ')}
                  >
                    <button
                      type="button"
                      onClick={() => void handleNotificationClick(notification)}
                      className="min-w-0 flex-1 rounded-lg px-1 py-0.5 text-left"
                    >
                      <p className="text-sm leading-snug">{notification.content}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(notification.timestamp).toLocaleString(currentLanguage === 'es' ? 'es-ES' : 'en-US', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </button>
                    <button
                      type="button"
                      title={t('header.notifications.delete')}
                      onClick={() => void handleDeleteNotification(notification)}
                      disabled={deletingNotificationId === notification.id}
                      className="mt-0.5 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-700 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            title={t('header.logout')}
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