import type { SortOption } from '../proposalTypes'

type Props = {
  selectedType: number | 'all'
  selectedTag: string
  sortBy: SortOption
  availableTags: string[]
  onlyInterested: boolean
  onlyLikedByMe: boolean
  tfgTypeOptions: Array<{ value: number; label: string }>
  sortOptions: Array<{ value: SortOption; label: string }>
  labels: {
    tfgType: string
    allTypes: string
    tag: string
    allTags: string
    sortBy: string
    clear: string
    onlyInterested: string
    onlyLikedByMe: string
  }
  onTypeChange: (value: number | 'all') => void
  onTagChange: (value: string) => void
  onSortChange: (value: SortOption) => void
  onOnlyInterestedChange: (value: boolean) => void
  onOnlyLikedByMeChange: (value: boolean) => void
  onReset: () => void
}

export function ProposalsFiltersPanel({
  selectedType,
  selectedTag,
  sortBy,
  availableTags,
  onlyInterested,
  onlyLikedByMe,
  tfgTypeOptions,
  sortOptions,
  labels,
  onTypeChange,
  onTagChange,
  onSortChange,
  onOnlyInterestedChange,
  onOnlyLikedByMeChange,
  onReset,
}: Props) {
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">{labels.tfgType}</label>
          <select
            value={selectedType}
            onChange={(event) => onTypeChange(event.target.value === 'all' ? 'all' : Number(event.target.value))}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
          >
            <option value="all">{labels.allTypes}</option>
            {tfgTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">{labels.tag}</label>
          <select
            value={selectedTag}
            onChange={(event) => onTagChange(event.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
          >
            <option value="all">{labels.allTags}</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">{labels.sortBy}</label>
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
            {labels.clear}
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
          {labels.onlyInterested}
        </label>

        <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            checked={onlyLikedByMe}
            onChange={(event) => onOnlyLikedByMeChange(event.target.checked)}
          />
          {labels.onlyLikedByMe}
        </label>
      </div>
    </>
  )
}
