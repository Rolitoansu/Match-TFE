import { PencilLine } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface AboutMeEditorProps {
  biography: string
  onSave: (nextBiography: string) => Promise<boolean>
}

export function AboutMeEditor({ biography, onSave }: AboutMeEditorProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState(biography)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!isEditing) {
      setValue(biography)
    }
  }, [biography, isEditing])

  useEffect(() => {
    if (!success) {
      return
    }

    const timeoutId = setTimeout(() => {
      setSuccess(null)
    }, 3000)

    return () => clearTimeout(timeoutId)
  }, [success])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const saved = await onSave(value.trim())

    if (saved) {
      setIsEditing(false)
      setSuccess(t('ownProfile.feedback.aboutUpdated'))
    } else {
      setError(t('ownProfile.feedback.aboutUpdateError'))
    }

    setIsSaving(false)
  }

  return (
    <div>
      <h3 className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {t('ownProfile.about.title')}
        <button
          type="button"
          className="text-primary transition-opacity hover:opacity-80"
          onClick={() => {
            setIsEditing((previous) => !previous)
            setError(null)
            setSuccess(null)
          }}
        >
          <PencilLine size={12} className="cursor-pointer" />
        </button>
      </h3>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            maxLength={2000}
            rows={4}
            className="w-full rounded-xl border border-border bg-white p-3 text-sm leading-relaxed outline-none focus:border-primary/50"
            placeholder={t('ownProfile.about.placeholder')}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{value.length}/2000</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-1.5 font-semibold transition-colors hover:bg-secondary"
                onClick={() => {
                  setIsEditing(false)
                  setValue(biography)
                  setError(null)
                }}
                disabled={isSaving}
              >
                {t('ownProfile.common.cancel')}
              </button>
              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                onClick={() => void handleSave()}
                disabled={isSaving}
              >
                {isSaving ? t('ownProfile.common.saving') : t('ownProfile.common.save')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-foreground/80 italic">
          "{value || t('ownProfile.about.empty')}"
        </p>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {success && <p className="mt-2 text-xs text-green-600">{success}</p>}
    </div>
  )
}
