import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Loader2 } from 'lucide-react'
import useAdminAuth from '../hooks/useAdminAuth'
import { useTranslation } from 'react-i18next'

export default function AdminLogin() {
    const { t } = useTranslation()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { login } = useAdminAuth()

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)
        try {
            await login(email, password)
            navigate('/admin')
        } catch {
            setError(t('admin.login.invalidCredentials'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 sm:px-6">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">

                <div className="mb-8 flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Shield className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">{t('admin.login.title')}</h2>
                    <p className="text-sm text-muted-foreground text-center">
                        {t('admin.login.subtitle')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-foreground ml-1">
                            {t('admin.login.emailLabel')}
                        </label>
                        <input
                            type="email"
                            className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-foreground ml-1">
                            {t('admin.login.passwordLabel')}
                        </label>
                        <input
                            type="password"
                            className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-white font-semibold shadow-md transition-all hover:opacity-90 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            t('admin.login.submit')
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
