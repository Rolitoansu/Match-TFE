import { 
  Plus, 
  Search, 
  FileText, 
  Users, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Heart
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import useAuth from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'

interface Proposal {
  id: number
  title: string
  description: string
  type: number
  publicationDate: string
  status: 'proposed' | 'in_progress' | 'completed'
  creatorName: string
  creatorSurname: string
  interestCount: number
  likedByCurrentUser: boolean
  interestedUsers?: Array<{
    id: number
    name: string
    surname: string
    email: string | null
    matchStatus: 'pending' | 'accepted' | 'rejected' | null
    likedAt: string
  }>
  tags?: string[]
}

type StatusTab = 'all' | 'open' | 'in_progress' | 'completed'

const STATUS_STYLE: Record<Proposal['status'], string> = {
  proposed: 'bg-green-50 text-green-600',
  in_progress: 'bg-blue-50 text-blue-600',
  completed: 'bg-slate-100 text-slate-600',
}

export default function Proposals() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [search, setSearch] = useState('')
  const [selectedTab, setSelectedTab] = useState<StatusTab>('all')
  const [onlyInterested, setOnlyInterested] = useState(false)
  const oppositeRolePluralLabel = user?.role === 'student'
    ? t('proposals.roles.professorsPlural')
    : t('proposals.roles.studentsPlural')
  
  useEffect(() => {
    async function fetchProposals() {
      try {
        const { data: { proposals } } = await api.get('/project/proposals')
        setProposals(proposals)
      } catch (error) {
        console.error('Error fetching proposals:', error)
      }
    }

    fetchProposals()
  }, [])

  const filteredProposals = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return proposals.filter((proposal) => {
      const matchesSearch = !normalizedSearch
        || proposal.title.toLowerCase().includes(normalizedSearch)
        || proposal.description.toLowerCase().includes(normalizedSearch)
        || (proposal.tags ?? []).some((tag) => tag.toLowerCase().includes(normalizedSearch))

      const matchesTab = selectedTab === 'all'
        || (selectedTab === 'open' && proposal.status === 'proposed')
        || (selectedTab === 'in_progress' && proposal.status === 'in_progress')
        || (selectedTab === 'completed' && proposal.status === 'completed')

      const matchesInterestFilter = !onlyInterested || proposal.interestCount > 0

      return matchesSearch && matchesTab && matchesInterestFilter
    })
  }, [proposals, search, selectedTab, onlyInterested])

  const tabs: Array<{ id: StatusTab; label: string }> = [
    { id: 'all', label: t('proposals.tabs.all') },
    { id: 'open', label: t('proposals.tabs.open') },
    { id: 'in_progress', label: t('proposals.tabs.inProgress') },
    { id: 'completed', label: t('proposals.tabs.completed') },
  ]

  const statusLabel: Record<Proposal['status'], string> = {
    proposed: t('proposals.status.open'),
    in_progress: t('proposals.status.inProgress'),
    completed: t('proposals.status.completed'),
  }

  const tfgTypeLabelById: Record<number, string> = {
    1: t('tfgTypes.research'),
    2: t('tfgTypes.hardwareSoftwareDevelopment'),
    3: t('tfgTypes.professionalExperience'),
    4: t('tfgTypes.qualitySecuritySystemsDesignAndImplementation'),
    5: t('tfgTypes.specificHardwareSoftwareImplementation'),
    6: t('tfgTypes.otherWorks'),
  }

  return (
    <div className="mx-auto max-w-300 p-4 sm:p-6 lg:p-10">
      <div className="mb-8 flex flex-col justify-between gap-4 md:mb-10 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t('proposals.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('proposals.subtitle', { rolePlural: oppositeRolePluralLabel })}</p>
        </div>
        
        <button 
          onClick={() => navigate('/proposals/new')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
        >
          <Plus size={20} />
          {t('proposals.newProposal')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder={t('proposals.searchPlaceholder')}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-border focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-white p-4">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            checked={onlyInterested}
            onChange={(event) => setOnlyInterested(event.target.checked)}
          />
          {t('proposals.onlyInterested')}
        </label>
      </div>

      <div className="mb-8 flex gap-6 overflow-x-auto border-b border-border sm:gap-8">
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`relative min-w-max pb-4 text-sm font-bold transition-all ${
              selectedTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {selectedTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredProposals.map((proposal) => (
          <div 
            key={proposal.id} 
            className="group bg-white border border-border rounded-3xl p-5 hover:border-primary/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all"
          >
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
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600" title={t('proposals.interestRegistered')}>
                        <Heart size={13} fill="currentColor" />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Clock size={14} /> {new Date(proposal.publicationDate).toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('proposalDetails.publishedBy')}: {proposal.creatorName} {proposal.creatorSurname}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('proposals.fields.tfgType')}: {tfgTypeLabelById[proposal.type] ?? t('tfgTypes.otherWorks')}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <CheckCircle2 size={14} /> {proposal.status === 'in_progress' ? t('proposals.assignment.assigned') : proposal.interestCount > 0 ? t('proposals.assignment.hasInterested') : t('proposals.assignment.noInterested')}
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
                          {person.matchStatus === 'accepted' ? ` (${t('proposals.badges.match')})` : ` (${t('proposals.badges.like')})`}
                        </span>
                      ))}
                      {proposal.interestedUsers.length > 3 && (
                        <span className="rounded-full px-3 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          +{proposal.interestedUsers.length - 3} {t('proposals.more')}
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
                      {proposal.status === 'in_progress' ? t('proposals.assignment.assigned') : proposal.interestCount}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                      {proposal.status === 'in_progress' ? t('proposals.fields.status') : t('proposals.fields.interested')}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground">{statusLabel[proposal.status]}</p>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{t('proposals.fields.status')}</p>
                  </div>
                </div>

                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-foreground transition-all hover:bg-primary hover:text-white sm:w-auto"
                    onClick={() => navigate(`/proposals/details/${proposal.id}`)}>
                    {t('proposals.viewDetails')}
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}

        {filteredProposals.length === 0 && (
          <div className="bg-white border border-border rounded-3xl p-8 text-center text-sm text-muted-foreground">
            {t('proposals.emptyFiltered')}
          </div>
        )}
      </div>
    </div>
  )
}