import { PencilLine } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProfileData } from '../types'

type NotificationFrequency = ProfileData['notificationFrequency']

interface NotificationPreferencesEditorProps {
  frequency: NotificationFrequency
  reminderHour: number
  onSave: (nextFrequency: NotificationFrequency, nextReminderHour: number) => Promise<boolean>
}

export function NotificationPreferencesEditor({ frequency, reminderHour, onSave }: NotificationPreferencesEditorProps) {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [draftFrequency, setDraftFrequency] = useState<NotificationFrequency>(frequency)
  const [draftReminderHour, setDraftReminderHour] = useState(reminderHour)

  useEffect(() => {
    if (!isEditing) {
      setDraftFrequency(frequency)
      setDraftReminderHour(reminderHour)
    }
  }, [frequency, reminderHour, isEditing])

  useEffect(() => {
    if (!success) {
      return
    }

    const timeoutId = setTimeout(() => {
      setSuccess(null)
    }, 3000)

    return () => clearTimeout(timeoutId)
  }, [success])

  const notificationFrequencyLabelByKey: Record<NotificationFrequency, string> = {
    disabled: t('ownProfile.notifications.frequency.disabled'),
    daily: t('ownProfile.notifications.frequency.daily'),
    weekly: t('ownProfile.notifications.frequency.weekly'),
    biweekly: t('ownProfile.notifications.frequency.biweekly'),
    monthly: t('ownProfile.notifications.frequency.monthly'),
  }

  const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const saved = await onSave(draftFrequency, draftReminderHour)

    if (saved) {
      setIsEditing(false)
      setSuccess(t('ownProfile.feedback.notificationFrequencyUpdated'))
    } else {
      setError(t('ownProfile.feedback.notificationFrequencyUpdateError'))
    }

    setIsSaving(false)
  }

  return (
    <div>
      <h3 className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {t('ownProfile.notifications.title')}
        <button
          type="button"
          className="text-primary transition-opacity hover:opacity-80"
          onClick={() => {
            setIsEditing((previous) => !previous)
            setDraftFrequency(frequency)
            setDraftReminderHour(reminderHour)
            setError(null)
            setSuccess(null)
          }}
        >
          <PencilLine size={12} className="cursor-pointer" />
        </button>
      </h3>

      {isEditing ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{t('ownProfile.notifications.helper')}</p>
          <select
            value={draftFrequency}
            onChange={(event) => setDraftFrequency(event.target.value as NotificationFrequency)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/50"
            disabled={isSaving}
          >
            <option value="disabled">{t('ownProfile.notifications.frequency.disabled')}</option>
            <option value="daily">{t('ownProfile.notifications.frequency.daily')}</option>
            <option value="weekly">{t('ownProfile.notifications.frequency.weekly')}</option>
            <option value="biweekly">{t('ownProfile.notifications.frequency.biweekly')}</option>
            <option value="monthly">{t('ownProfile.notifications.frequency.monthly')}</option>
          </select>

          {draftFrequency !== 'disabled' && (
            <div className="space-y-1">
              <label htmlFor="notificationReminderHour" className="text-xs font-semibold text-muted-foreground">
                {t('ownProfile.notifications.hourLabel')}
              </label>
              <input
                id="notificationReminderHour"
                type="number"
                min={0}
                max={23}
                step={1}
                value={draftReminderHour}
                onChange={(event) => setDraftReminderHour(Math.min(23, Math.max(0, Number(event.target.value) || 0)))}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/50"
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">{t('ownProfile.notifications.hourHelper')}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-secondary"
              onClick={() => {
                setIsEditing(false)
                setDraftFrequency(frequency)
                setDraftReminderHour(reminderHour)
                setError(null)
              }}
              disabled={isSaving}
            >
              {t('ownProfile.common.cancel')}
            </button>
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              onClick={() => void handleSave()}
              disabled={isSaving}
            >
              {isSaving ? t('ownProfile.common.saving') : t('ownProfile.notifications.save')}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-foreground/80">
          {frequency === 'disabled'
            ? notificationFrequencyLabelByKey[frequency]
            : `${notificationFrequencyLabelByKey[frequency]} · ${formatHour(reminderHour)}`}
        </p>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {success && <p className="mt-2 text-xs text-green-600">{success}</p>}
    </div>
  )
}
