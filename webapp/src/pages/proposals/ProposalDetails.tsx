import { 
  ArrowLeft, BookOpen, MessageSquare, 
  Hash, GraduationCap, UserCheck, Mail, Heart, Users, RefreshCw
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import useAuth from '../../hooks/useAuth'

interface ProposalDetailsData {
  id: number
  title: string
  description: string
  publicationDate: string
  isOwner: boolean
  status: 'proposed' | 'in_progress' | 'completed'
  tags: string[]
  user: {
    id: number
    name: string
    surname: string
    email: string | null
  } | null
  interestedUsers: Array<{
    id: number
    name: string
    surname: string
    email: string | null
    matchStatus: 'pending' | 'accepted' | 'rejected' | null
    likedAt: string
  }>
}

const STATUS_LABEL: Record<ProposalDetailsData['status'], string> = {
  proposed: 'Abierta',
  in_progress: 'En curso',
  completed: 'Finalizada',
}

export default function ProposalDetails() {
  const id = useParams().id
  const navigate = useNavigate()
  const { user } = useAuth()
  const [proposal, setProposal] = useState<ProposalDetailsData | null>(null)
  const [renewing, setRenewing] = useState(false)
  const [renewFeedback, setRenewFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!renewFeedback) return

    const timer = setTimeout(() => {
      setRenewFeedback(null)
    }, 3000)

    return () => clearTimeout(timer)
  }, [renewFeedback])

  async function handleRenew() {
    if (!proposal) return
    setRenewFeedback(null)
    setRenewing(true)
    try {
      const { data } = await api.patch(`/project/proposals/${id}/renew`)

      if (data?.publicationDate) {
        setProposal(prev => prev ? { ...prev, publicationDate: data.publicationDate } : prev)
      }

      // Refresh from backend so the UI always reflects persisted values.
      const { data: refreshedData } = await api.get(`/project/proposals/${id}`)
      if (refreshedData?.proposal) {
        setProposal(refreshedData.proposal)
      }

      if (data?.expiresAt) {
        setRenewFeedback(`Caduca el ${new Date(data.expiresAt).toLocaleDateString('es-ES')}`)
      } else {
        setRenewFeedback('Caducidad renovada correctamente')
      }
    } catch (error) {
      console.error('Error renewing proposal:', error)
      setRenewFeedback('No se pudo renovar. Intenta de nuevo.')
    } finally {
      setRenewing(false)
    }
  }

  useEffect(() => {
    async function fetchProposal() {
      try {
        const { data: { proposal: proposalContents } } = await api.get(`/project/proposals/${id}`)
        setProposal(proposalContents)
      } catch (error) {
        console.error("Error fetching proposal:", error)
        navigate('/home/proposals')
      }
    }

    fetchProposal()
  }, [])

  const canRenew = Boolean(proposal?.isOwner || (proposal?.user?.id && user?.id && proposal.user.id === user.id))

  return proposal && (
    <div className="max-w-6xl mx-auto p-6 lg:p-10 pb-32">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-semibold">
          <ArrowLeft size={20} /> Volver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-blue-100 text-blue-700">
                {STATUS_LABEL[proposal.status]}
              </span>
              <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{new Date(proposal.publicationDate).toLocaleString()}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black text-foreground leading-tight">
              {proposal.title}
            </h1>
          </div>

          <section className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <BookOpen size={16} /> Descripción del Proyecto
            </h3>
            <p className="text-foreground/80 leading-relaxed text-lg">
              {proposal.description}
            </p>
          </section>

          <div className="flex flex-wrap gap-2">
            {proposal.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-border rounded-xl text-xs font-bold text-foreground">
                <Hash size={14} className="text-primary" /> {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-border rounded-3xl p-8 shadow-sm space-y-6 sticky top-8">
            
            <div className="space-y-4 text-center">
              <div className="mx-auto h-20 w-20 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                {proposal.status === 'in_progress' ? <UserCheck size={40} /> : <GraduationCap size={40} />}
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Publicado por</p>
                <h4 className="text-xl font-bold">{proposal.user ? `${proposal.user.name} ${proposal.user.surname}` : 'Autor no disponible'}</h4>
                {proposal.user?.email ? (
                  <p className="text-sm text-primary font-medium flex items-center justify-center gap-1.5 mt-1">
                    <Mail size={14} /> {proposal.user.email}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">El correo se habilita cuando hay match.</p>
                )}
              </div>
            </div>

            <hr className="border-border/60" />

            <div className="space-y-3">
              {canRenew && (
                <button
                  onClick={handleRenew}
                  disabled={renewing}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-emerald-700 text-emerald-50 font-black shadow-sm transition-colors hover:bg-emerald-800 disabled:opacity-60"
                >
                  <RefreshCw size={18} className={renewing ? 'animate-spin' : ''} />
                  {renewing ? 'Renovando…' : 'Renovar TFG (1 año)'}
                </button>
              )}
              {renewFeedback && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  {renewFeedback}
                </p>
              )}
              <button className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-lg shadow-primary/20 hover:opacity-90 transition-all" disabled>
                <MessageSquare size={20} />
                Contacto por correo
              </button>
              
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                <p className="text-[10px] text-blue-800 font-bold leading-relaxed uppercase text-center">
                  Si hay match, se muestran correos y podéis poneros en contacto.
                </p>

                <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                  <span className="inline-flex items-center gap-1"><Users size={13} /> Likes recibidos</span>
                  <span>{proposal.interestedUsers.length}</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {proposal.interestedUsers.length === 0 && (
                    <p className="text-xs text-blue-800/80 text-center py-2">Todavía nadie ha dado like a este TFG.</p>
                  )}

                  {proposal.interestedUsers.map((person) => (
                    <div key={person.id} className="rounded-xl border border-blue-200/80 bg-white/80 p-2.5">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Heart size={12} className="text-rose-500" />
                        {person.name} {person.surname}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {person.matchStatus === 'accepted'
                          ? person.email
                            ? `Match confirmado · ${person.email}`
                            : 'Match confirmado'
                          : 'Like recibido · pendiente de match'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}