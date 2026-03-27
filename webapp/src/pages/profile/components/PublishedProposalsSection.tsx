import { Calendar, ChevronRight, FileText, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Proposal } from '../types'

interface PublishedProposalsSectionProps {
  proposals: Proposal[]
  onOpenProposal: (proposalId: number) => void
}

export function PublishedProposalsSection({ proposals, onOpenProposal }: PublishedProposalsSectionProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className="mb-2 flex items-center justify-between px-2">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <FileText className="text-primary" size={20} />
          {t('ownProfile.published.title')}
        </h3>
      </div>

      <div className="grid gap-4">
        {proposals.map((proposal) => (
          <div key={proposal.id} className="group rounded-3xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    proposal.status === 'Abierto' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {proposal.status}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Calendar size={12} /> {new Date(proposal.publicationDate).toLocaleString()}
                  </span>
                </div>

                <h4 className="text-xl font-bold text-foreground transition-colors group-hover:text-primary">
                  {proposal.title}
                </h4>

                <div className="flex flex-wrap gap-2">
                  {proposal.tags.map((tag) => (
                    <span key={tag} className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6 border-t border-border/50 pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                <div className="text-center">
                  <div className="mb-1 flex items-center justify-center gap-1.5 text-primary">
                    <Users size={16} />
                    <span className="text-lg font-black">{'3'}</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Candidatos</p>
                </div>
                <button
                  className="rounded-2xl bg-primary/5 p-3 text-primary transition-all group-hover:bg-primary group-hover:text-white"
                  onClick={() => onOpenProposal(proposal.id)}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {proposals.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-slate-50 py-20">
          <FileText size={48} className="mb-4 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">{t('ownProfile.published.empty')}</p>
          <a className="mt-4 text-sm font-bold text-primary hover:underline" href="/proposals/new">{t('ownProfile.published.createFirst')}</a>
        </div>
      )}
    </div>
  )
}
