import { ChevronDown, Hash, PencilLine, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TagOption } from '../types'

interface InterestsEditorProps {
  selectedInterests: string[]
  availableTags: TagOption[]
  onSave: (nextInterests: string[]) => Promise<boolean>
}

export function InterestsEditor({ selectedInterests, availableTags, onSave }: InterestsEditorProps) {
  const { t } = useTranslation()
  const [draftInterests, setDraftInterests] = useState<string[]>(selectedInterests)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [interestSearch, setInterestSearch] = useState('')
  const [debouncedInterestSearch, setDebouncedInterestSearch] = useState('')
  const [interestInputFocused, setInterestInputFocused] = useState(false)
  const interestInputRef = useRef<HTMLInputElement>(null)
  const interestSuggestionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isEditing) {
      setDraftInterests(selectedInterests)
    }
  }, [selectedInterests, isEditing])

  useEffect(() => {
    if (!success) {
      return
    }

    const timeoutId = setTimeout(() => {
      setSuccess(null)
    }, 3000)

    return () => clearTimeout(timeoutId)
  }, [success])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInterestSearch(interestSearch), 300)
    return () => clearTimeout(timer)
  }, [interestSearch])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        interestInputRef.current && !interestInputRef.current.contains(event.target as Node) &&
        interestSuggestionRef.current && !interestSuggestionRef.current.contains(event.target as Node)
      ) {
        setInterestInputFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleInterest = (tagName: string) => {
    setDraftInterests((previous) => {
      if (previous.includes(tagName)) {
        return previous.filter((value) => value !== tagName)
      }

      return [...previous, tagName]
    })
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) {
      return <span>{text}</span>
    }

    const index = text.toLowerCase().indexOf(query.trim().toLowerCase())

    if (index === -1) {
      return <span>{text}</span>
    }

    return (
      <span>
        {text.slice(0, index)}
        <mark className="rounded bg-primary/20 px-0.5 text-primary">{text.slice(index, index + query.trim().length)}</mark>
        {text.slice(index + query.trim().length)}
      </span>
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const saved = await onSave(draftInterests)

    if (saved) {
      setIsEditing(false)
      setSuccess(t('ownProfile.feedback.interestsUpdated'))
    } else {
      setError(t('ownProfile.feedback.interestsUpdateError'))
    }

    setIsSaving(false)
  }

  const selectedSet = new Set(draftInterests)
  const filtered = availableTags
    .map((tag) => tag.name)
    .filter((tag) => !selectedSet.has(tag)
      && (!debouncedInterestSearch.trim()
        || tag.toLowerCase().includes(debouncedInterestSearch.trim().toLowerCase())))
  const searching = debouncedInterestSearch.trim().length > 0

  return (
    <div>
      <h3 className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {t('ownProfile.interests.title')}
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
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{t('ownProfile.interests.helper')}</p>

          {draftInterests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {draftInterests.map((tag) => (
                <span key={tag} className="animate-in fade-in slide-in-from-top-1 duration-150 flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 py-1.5 pl-3 pr-2 text-xs font-bold text-primary">
                  {tag}
                  <button type="button" onClick={() => toggleInterest(tag)} className="rounded-md p-0.5 transition-colors hover:bg-primary/20">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <Hash className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              ref={interestInputRef}
              type="text"
              placeholder={t('ownProfile.interests.searchPlaceholder')}
              className={`w-full rounded-xl bg-slate-50 py-3 pl-10 pr-9 text-sm outline-none transition-all ${
                interestInputFocused
                  ? 'border border-primary/50 bg-white ring-4 ring-primary/5'
                  : 'border border-transparent hover:border-border'
              }`}
              value={interestSearch}
              onChange={(event) => setInterestSearch(event.target.value)}
              onFocus={() => setInterestInputFocused(true)}
              autoComplete="off"
            />
            <ChevronDown
              size={15}
              className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform duration-200 ${
                interestInputFocused ? 'rotate-180' : ''
              }`}
            />

            {interestInputFocused && (
              <div
                ref={interestSuggestionRef}
                className="absolute bottom-full left-0 right-0 z-60 mb-1.5 overflow-hidden rounded-2xl border border-border bg-white shadow-xl shadow-slate-200/70"
              >
                <div className="flex items-center justify-between border-b border-border/50 px-4 py-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {searching ? t('ownProfile.interests.results') : t('ownProfile.interests.available')}
                  </span>
                  {filtered.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {filtered.length}
                    </span>
                  )}
                </div>

                {filtered.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto">
                    {filtered.map((tag, index) => (
                      <button
                        key={tag}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          toggleInterest(tag)
                          setInterestSearch('')
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-primary/5 hover:text-primary ${
                          index !== filtered.length - 1 ? 'border-b border-border/40' : ''
                        }`}
                      >
                        {highlightMatch(tag, debouncedInterestSearch)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {searching
                        ? t('ownProfile.interests.noMatch', { search: debouncedInterestSearch })
                        : t('ownProfile.interests.allAdded')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-secondary"
              onClick={() => {
                setIsEditing(false)
                setDraftInterests(selectedInterests)
                setInterestSearch('')
                setInterestInputFocused(false)
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
              {isSaving ? t('ownProfile.common.saving') : t('ownProfile.interests.save')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {draftInterests.length > 0 ? draftInterests.map((interest) => (
            <span key={interest} className="rounded-full border border-border/60 bg-secondary px-2 py-1 text-[10px] font-semibold text-muted-foreground">
              #{interest}
            </span>
          )) : (
            <p className="text-sm italic text-foreground/70">{t('ownProfile.interests.empty')}</p>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {success && <p className="mt-2 text-xs text-green-600">{success}</p>}
    </div>
  )
}
