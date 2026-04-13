import { Plus, Search } from 'lucide-react'

type Props = {
  title: string
  subtitle: string
  newProposalLabel: string
  searchPlaceholder: string
  search: string
  onSearchChange: (value: string) => void
  onCreateProposal: () => void
}

export function ProposalsHeader({
  title,
  subtitle,
  newProposalLabel,
  searchPlaceholder,
  search,
  onSearchChange,
  onCreateProposal,
}: Props) {
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 md:mb-10 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <button
          onClick={onCreateProposal}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
        >
          <Plus size={20} />
          {newProposalLabel}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-border focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
    </>
  )
}
