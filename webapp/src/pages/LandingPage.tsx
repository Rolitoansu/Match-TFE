import { Button } from '@mui/material'
import { GraduationCap, Users, Sparkles } from "lucide-react"
import { useTranslation } from 'react-i18next'

export default function LandingPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card shadow-lg">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-primary-foreground">
            Match-TFE
          </h1>
          <p className="text-center text-sm text-primary-foreground/80">
            {t('landing.subtitle')}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 px-4 py-3">
            <Sparkles className="h-5 w-5 shrink-0 text-primary-foreground" />
            <p className="text-sm text-primary-foreground">
              {t('landing.featureMatch')}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 px-4 py-3">
            <Users className="h-5 w-5 shrink-0 text-primary-foreground" />
            <p className="text-sm text-primary-foreground">
              {t('landing.featureConnect')}
            </p>
          </div>

        </div>

        <div className="flex w-full flex-col gap-3">
          <Button
            className="w-full rounded-full bg-card text-primary shadow-lg hover:bg-card/90 font-semibold text-base h-12"
            href='/login'
          >
            {t('landing.loginWithMicrosoft')}
          </Button>
          <p className="text-center text-xs text-primary-foreground/60">
            {t('landing.university')}
          </p>
        </div>
      </div>
    </div>
  )
};