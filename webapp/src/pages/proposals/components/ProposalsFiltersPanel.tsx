import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import type { SortOption } from '../model/proposalTypes'

type Props = {
  selectedType: number | 'all'
  selectedTag: string
  sortBy: SortOption
  availableTags: string[]
  onlyInterested: boolean
  onlyLikedByMe: boolean
  onTypeChange: (value: number | 'all') => void
  onTagChange: (value: string) => void
  onSortChange: (value: SortOption) => void
  onOnlyInterestedChange: (value: boolean) => void
  onOnlyLikedByMeChange: (value: boolean) => void
  onReset: () => void
  onExportCSV: () => void
  onExportPDF: () => void
}

export function ProposalsFiltersPanel({
  selectedType,
  selectedTag,
  sortBy,
  availableTags,
  onlyInterested,
  onlyLikedByMe,
  onTypeChange,
  onTagChange,
  onSortChange,
  onOnlyInterestedChange,
  onOnlyLikedByMeChange,
  onReset,
  onExportCSV,
  onExportPDF,
}: Props) {
  const { t } = useTranslation()

  const tfgTypeOptions = [
    { value: 1, label: t('tfgTypes.research') },
    { value: 2, label: t('tfgTypes.hardwareSoftwareDevelopment') },
    { value: 3, label: t('tfgTypes.professionalExperience') },
    { value: 4, label: t('tfgTypes.qualitySecuritySystemsDesignAndImplementation') },
    { value: 5, label: t('tfgTypes.specificHardwareSoftwareImplementation') },
    { value: 6, label: t('tfgTypes.otherWorks') },
  ]

  const sortOptions: Array<{ value: SortOption; label: string }> = [
    { value: 'recent', label: t('proposals.sort.recent') },
    { value: 'oldest', label: t('proposals.sort.oldest') },
    { value: 'most_interested', label: t('proposals.sort.mostInterested') },
    { value: 'title_asc', label: t('proposals.sort.titleAZ') },
  ]

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">{t('proposals.filters.tfgType')}</label>
          <select
            value={selectedType}
            onChange={(event) => onTypeChange(event.target.value === 'all' ? 'all' : Number(event.target.value))}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
          >
            <option value="all">{t('proposals.filters.allTypes')}</option>
            {tfgTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">{t('proposals.filters.tag')}</label>
          <select
            value={selectedTag}
            onChange={(event) => onTagChange(event.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
          >
            <option value="all">{t('proposals.filters.allTags')}</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">{t('proposals.filters.sortBy')}</label>
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value as SortOption)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onReset}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            {t('proposals.filters.clear')}
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            checked={onlyInterested}
            onChange={(event) => onOnlyInterestedChange(event.target.checked)}
          />
          {t('proposals.onlyInterested')}
        </label>

        <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            checked={onlyLikedByMe}
            onChange={(event) => onOnlyLikedByMeChange(event.target.checked)}
          />
          {t('proposals.filters.onlyLikedByMe')}
        </label>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:gap-2">
        <span className="text-sm font-medium text-muted-foreground">{t('proposals.export.label')}</span>
        <button
          type="button"
          onClick={onExportCSV}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
        >
          <Download className="h-4 w-4" />
          {t('proposals.export.csv')}
        </button>
        <button
          type="button"
          onClick={onExportPDF}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
        >
          <Download className="h-4 w-4" />
          {t('proposals.export.pdf')}
        </button>
      </div>
    </>
  )
}
