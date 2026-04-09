import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getApiBaseUrl } from '../api/baseUrl'

export default function Login() {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const handleMicrosoftLogin = () => {
        const baseUrl = getApiBaseUrl()
        window.location.assign(`${baseUrl}/auth/microsoft/login`)
    }

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 sm:px-6">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
                <div className="mb-8 flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <LogIn className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">{t('login.title')}</h2>
                    <p className="text-sm text-muted-foreground text-center">
                        {t('login.subtitle')}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleMicrosoftLogin}
                    className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    {t('login.microsoftSubmit')}
                </button>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    <button
                        type="button"
                        className="underline underline-offset-4 hover:text-primary"
                        onClick={() => navigate('/')}
                    >
                        {t('login.backToLanding')}
                    </button>
                </p>
            </div>
        </div>
    )
}