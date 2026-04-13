import { ArrowUpRight, CheckCircle2, Clock, FileText, Heart, Users } from 'lucide-react'
import type { Proposal } from '../proposalTypes'

type Props = {
  proposal: Proposal
  statusLabel: Record<Proposal['status'], string>
  tfgTypeLabelById: Record<number, string>
  assignmentLabels: {
    assigned: string
    hasInterested: string
    noInterested: string
  }
  fieldLabels: {
    publishedBy: string
    tfgType: string
    status: string
    interested: string
  }
  badgeLabels: {
    match: string
    like: string
    more: string
    interestRegistered: string
  }
  viewDetailsLabel: string
  onViewDetails: (proposalId: number) => void
}

const STATUS_STYLE: Record<Proposal['status'], string> = {
  proposed: 'bg-green-50 text-green-600',
  in_progress: 'bg-blue-50 text-blue-600',
  completed: 'bg-slate-100 text-slate-600',
}

export function ProposalCard({
  proposal,
  statusLabel,
  tfgTypeLabelById,
  assignmentLabels,
  fieldLabels,
  badgeLabels,
  viewDetailsLabel,
  onViewDetails,
}: Props) {
  return (
    <div className="group bg-white border border-border rounded-3xl p-5 hover:border-primary/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="flex items-start gap-4 flex-1">
          <div className={`p-3 rounded-2xl shrink-0 ${STATUS_STYLE[proposal.status]}`}>
            <FileText size={24} />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {proposal.title}
              </h3>
              {proposal.likedByCurrentUser && (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600" title={badgeLabels.interestRegistered}>
                  <Heart size={13} fill="currentColor" />
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Clock size={14} /> {new Date(proposal.publicationDate).toLocaleString()}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {fieldLabels.publishedBy}: {proposal.creatorName} {proposal.creatorSurname}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {fieldLabels.tfgType}: {tfgTypeLabelById[proposal.type]}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <CheckCircle2 size={14} /> {proposal.status === 'in_progress' ? assignmentLabels.assigned : proposal.interestCount > 0 ? assignmentLabels.hasInterested : assignmentLabels.noInterested}
              </span>
            </div>

            {proposal.interestedUsers && proposal.interestedUsers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {proposal.interestedUsers.slice(0, 3).map((person) => (
                  <span
                    key={person.id}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold border ${
                      person.matchStatus === 'accepted'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {person.name} {person.surname}
                    {person.matchStatus === 'accepted' ? ` (${badgeLabels.match})` : ` (${badgeLabels.like})`}
                  </span>
                ))}
                {proposal.interestedUsers.length > 3 && (
                  <span className="rounded-full px-3 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    +{proposal.interestedUsers.length - 3} {badgeLabels.more}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-50 pt-4 sm:flex-row sm:items-center sm:justify-between lg:justify-end lg:gap-8 lg:border-t-0 lg:pt-0">
          <div className="flex gap-6 sm:gap-4">
            <div className="text-center">
              <p className="text-sm font-bold text-foreground flex items-center gap-1.5 justify-center">
                <Users size={16} className="text-primary" />
                {proposal.status === 'in_progress' ? assignmentLabels.assigned : proposal.interestCount}
              </p>
              <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                {proposal.status === 'in_progress' ? fieldLabels.status : fieldLabels.interested}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{statusLabel[proposal.status]}</p>
              <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{fieldLabels.status}</p>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-foreground transition-all hover:bg-primary hover:text-white sm:w-auto"
              onClick={() => onViewDetails(proposal.id)}
            >
              {viewDetailsLabel}
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
