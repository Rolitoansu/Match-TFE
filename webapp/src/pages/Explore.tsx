import { 
  GraduationCap,
  Heart,
  X,
  Briefcase,
  Sparkles
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'

type MatchStatus = 'pending' | 'accepted' | 'rejected' | null

interface ExploreProposal {
  id: number
  title: string
  description: string | null
  publicationDate: string
  status: string
  creatorId: number
  creatorName: string
  creatorSurname: string
  creatorBiography: string | null
  liked: boolean
  matchStatus: MatchStatus
  tags: string[]
}

interface ExploreResponse {
  viewerRole: 'student' | 'professor'
  proposals: ExploreProposal[]
}

export default function Explore() {
  const [proposals, setProposals] = useState<ExploreProposal[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewerRole, setViewerRole] = useState<'student' | 'professor' | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingLike, setLoadingLike] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchExplore() {
      try {
        setLoading(true)
        const { data } = await api.get<ExploreResponse>('/project/explore')
        setViewerRole(data.viewerRole)
        setProposals(data.proposals)
        setCurrentIndex(0)
      } catch (fetchError) {
        console.error(fetchError)
        setError('No se pudieron cargar propuestas para explorar ahora mismo.')
      } finally {
        setLoading(false)
      }
    }

    fetchExplore()
  }, [])

  const currentProposal = useMemo(() => proposals[currentIndex] ?? null, [proposals, currentIndex])

  const profileTypeLabel = viewerRole === 'student' ? 'Profesor' : 'Estudiante'

  async function likeCurrentProposal() {
    if (!currentProposal || loadingLike) {
      return
    }

    try {
      setLoadingLike(true)
      const { data } = await api.post<{ liked: boolean; matchStatus: MatchStatus }>(`/project/proposals/${currentProposal.id}/like`)

      setProposals((previous) => previous.map((proposal, index) => {
        if (index !== currentIndex) {
          return proposal
        }

        return {
          ...proposal,
          liked: true,
          matchStatus: data.matchStatus,
        }
      }))

      setCurrentIndex((prev) => prev + 1)
    } catch (likeError) {
      console.error(likeError)
      setError('No se pudo registrar tu interés. Inténtalo de nuevo.')
    } finally {
      setLoadingLike(false)
    }
  }

  function skipCurrentProposal() {
    if (!currentProposal || loadingLike) {
      return
    }

    setLoadingLike(true)
    api.post(`/project/proposals/${currentProposal.id}/pass`)
      .then(() => {
        setCurrentIndex((prev) => prev + 1)
      })
      .catch((skipError) => {
        console.error(skipError)
        setError('No se pudo registrar el descarte. Inténtalo de nuevo.')
      })
      .finally(() => {
        setLoadingLike(false)
      })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md rounded-4xl border border-border bg-card p-10 text-center shadow-2xl shadow-gray-200/50">
          <p className="text-sm text-muted-foreground">Cargando propuestas para ti...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md rounded-4xl border border-border bg-card p-10 text-center shadow-2xl shadow-gray-200/50">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!currentProposal) {
    return (
      <div className="flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md rounded-4xl border border-border bg-card p-10 text-center shadow-2xl shadow-gray-200/50">
          <Sparkles className="mx-auto mb-3 text-primary" size={24} />
          <h2 className="text-lg font-bold text-foreground">No hay más propuestas por ahora</h2>
          <p className="mt-2 text-sm text-muted-foreground">Vuelve más tarde para descubrir nuevos TFGs del otro rol.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md overflow-hidden rounded-4xl border border-border bg-card shadow-2xl shadow-gray-200/50">

        <div className="flex flex-col items-center justify-end bg-primary/5 pt-8 pb-8 relative">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap size={64} strokeWidth={1.5} />
          </div>

          <div className="mt-6 text-center px-6">
            <h2 className="text-2xl font-bold text-foreground">
              {currentProposal.creatorName} {currentProposal.creatorSurname}
            </h2>
            <p className="text-muted-foreground">{profileTypeLabel}</p>
          </div>
        </div>

        <div className="p-8">
          <h3 className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
            <Briefcase size={14} /> TFG Publicado
          </h3>
          <p className="mt-2 text-lg font-bold text-foreground leading-tight">{currentProposal.title}</p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            {currentProposal.description || currentProposal.creatorBiography || 'Sin descripción adicional.'}
          </p>

          <div className="mt-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Etiquetas
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {currentProposal.tags.length > 0 ? currentProposal.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-foreground border border-border/50"
                >
                  {tag}
                </span>
              )) : (
                <span className="text-xs text-muted-foreground">Sin etiquetas</span>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              onClick={skipCurrentProposal}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
              disabled={loadingLike}
            >
              <X size={16} /> Pasar
            </button>
            <button
              onClick={likeCurrentProposal}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              disabled={loadingLike || currentProposal.liked}
            >
              <Heart size={16} />
              {currentProposal.matchStatus === 'accepted' ? 'Match hecho' : currentProposal.liked ? 'Interés enviado' : 'Me gusta'}
            </button>
          </div>

          <p className="mt-4 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
            {Math.min(currentIndex + 1, proposals.length)} de {proposals.length}
          </p>

          {currentProposal.matchStatus === 'pending' && (
            <p className="mt-3 text-center text-xs text-amber-600 font-medium">Interés registrado. Esperando respuesta de la otra parte.</p>
          )}
          {currentProposal.matchStatus === 'accepted' && (
            <p className="mt-3 text-center text-xs text-emerald-600 font-medium">¡Es un match! Ya podéis pasar al chat.</p>
          )}
          {currentProposal.matchStatus === 'rejected' && (
            <p className="mt-3 text-center text-xs text-rose-600 font-medium">La propuesta no está disponible para match actualmente.</p>
          )}
        </div>
      </div>
    </div>
  )
}