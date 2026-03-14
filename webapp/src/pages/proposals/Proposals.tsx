import { 
  Plus, 
  Search, 
  FileText, 
  MoreVertical, 
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

interface Proposal {
  id: number
  title: string
  description: string
  publicationDate: string
  status: 'proposed' | 'in_progress' | 'completed'
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

const STATUS_LABEL: Record<Proposal['status'], string> = {
  proposed: 'Abierta',
  in_progress: 'En curso',
  completed: 'Finalizada',
}

const STATUS_STYLE: Record<Proposal['status'], string> = {
  proposed: 'bg-green-50 text-green-600',
  in_progress: 'bg-blue-50 text-blue-600',
  completed: 'bg-slate-100 text-slate-600',
}

export default function Proposals() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [search, setSearch] = useState('')
  const [selectedTab, setSelectedTab] = useState<StatusTab>('all')
  const [onlyInterested, setOnlyInterested] = useState(false)
  const oppositeRolePluralLabel = user?.role === 'student' ? 'profesores' : 'alumnos'
  
  useEffect(() => {
    async function fetchProposals() {
      try {
        const { data: { proposals } } = await api.get('/project/proposals')
        setProposals(proposals)
      } catch (error) {
        console.error('Error al obtener propuestas:', error)
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
    { id: 'all', label: 'Todas' },
    { id: 'open', label: 'Abiertas' },
    { id: 'in_progress', label: 'En curso' },
    { id: 'completed', label: 'Finalizadas' },
  ]

  return (
    <div className="max-w-300 mx-auto p-6 lg:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Propuestas</h1>
          <p className="text-muted-foreground mt-1">Consulta los TFGs publicados por {oppositeRolePluralLabel} y revisa su estado.</p>
        </div>
        
        <button 
          onClick={() => navigate('/proposals/new')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={20} />
          Nueva Propuesta
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por título o tecnología..."
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
          Mostrar solo propuestas con interesados
        </label>
      </div>

      <div className="flex gap-8 border-b border-border mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`pb-4 text-sm font-bold transition-all relative ${
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-2xl shrink-0 ${STATUS_STYLE[proposal.status]}`}>
                  <FileText size={24} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {proposal.title}
                    </h3>
                    {proposal.likedByCurrentUser && (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600" title="Interes registrado">
                        <Heart size={13} fill="currentColor" />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Clock size={14} /> {new Date(proposal.publicationDate).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <CheckCircle2 size={14} /> {proposal.interestCount > 0 ? 'Hay interesados' : 'Sin interesados'}
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
                          {person.matchStatus === 'accepted' ? ' (match)' : ' (like)'}
                        </span>
                      ))}
                      {proposal.interestedUsers.length > 3 && (
                        <span className="rounded-full px-3 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          +{proposal.interestedUsers.length - 3} más
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-8 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-50">
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5 justify-center">
                      <Users size={16} className="text-primary" />
                      {proposal.interestCount}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Interesados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground">
                      {proposal.interestedUsers?.filter((person) => person.matchStatus === 'accepted').length ?? 0}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Matches</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground">{STATUS_LABEL[proposal.status]}</p>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Estado</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all"
                    onClick={() => navigate(`/proposals/details/${proposal.id}`)}>
                    Ver Detalles
                    <ArrowUpRight size={14} />
                  </button>
                  <button className="p-2 text-muted-foreground hover:bg-slate-100 rounded-lg transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}

        {filteredProposals.length === 0 && (
          <div className="bg-white border border-border rounded-3xl p-8 text-center text-sm text-muted-foreground">
            No hay propuestas que coincidan con los filtros seleccionados.
          </div>
        )}
      </div>
    </div>
  )
}