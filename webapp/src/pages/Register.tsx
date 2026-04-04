import { useState } from 'react'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Mail, Lock, User, Loader2 } from "lucide-react"
import { useTranslation } from 'react-i18next'

interface RegisterProps {
    email: string
    name: string
    surname: string
    password: string
    repeatPassword: string
}

export default function Register() {
    const { t } = useTranslation()
    const [registerData, setRegisterData] = useState<RegisterProps>({ 
        email: '', name: '', surname: '', password: '', repeatPassword: '' 
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const { register } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        if (registerData.password !== registerData.repeatPassword) {
            setError(t('register.errorPasswordsMismatch'))
            return
        }

        setIsLoading(true)
        try {
            await register(
                registerData.email, 
                registerData.name, 
                registerData.surname, 
                registerData.password
            )
            navigate('/home')
        } catch (err) {
            setError(t('register.errorCreateAccount'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-12">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
                <div className="mb-8 flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserPlus className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">{t('register.title')}</h2>
                    <p className="text-sm text-muted-foreground text-center">
                        {t('register.subtitle')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-foreground/70 ml-1 uppercase">{t('register.nameLabel')}</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <input 
                                    type="text"
                                    required
                                    className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={registerData.name}
                                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-foreground/70 ml-1 uppercase">{t('register.surnameLabel')}</label>
                            <input 
                                type="text"
                                required
                                className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={registerData.surname}
                                onChange={(e) => setRegisterData({ ...registerData, surname: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-foreground/70 ml-1 uppercase">{t('register.emailLabel')}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <input 
                                type="email"
                                placeholder={t('register.emailPlaceholder')}
                                required
                                className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={registerData.email}
                                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-foreground/70 ml-1 uppercase">{t('register.passwordLabel')}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <input 
                                    type="password"
                                    required
                                    className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={registerData.password}
                                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-foreground/70 ml-1 uppercase">{t('register.repeatPasswordLabel')}</label>
                            <input 
                                type="password"
                                required
                                className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={registerData.repeatPassword}
                                onChange={(e) => setRegisterData({ ...registerData, repeatPassword: e.target.value })}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive font-medium border border-destructive/20 text-center">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-lg hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('register.submit')}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    {t('register.hasAccount')} <a href="/login" className="underline underline-offset-4 hover:text-primary">{t('register.loginLink')}</a>
                </p>
            </div>
        </div>
    )
}