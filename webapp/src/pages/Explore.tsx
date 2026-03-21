import { 
  GraduationCap,
  Heart,
  X,
  Briefcase,
  Sparkles,
  FileText,
  User
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'

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
  matchedProposal: {
    id: number
    title: string
    description: string | null
    publicationDate: string
    status: 'proposed' | 'in_progress' | 'completed'
    tags: string[]
    counterpartId: number
    counterpartName: string
    counterpartSurname: string
    counterpartEmail: string
  } | null
}

export default function Explore() {
  const navigate = useNavigate()
  const [proposals, setProposals] = useState<ExploreProposal[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewerRole, setViewerRole] = useState<'student' | 'professor' | null>(null)
  const [matchedProposal, setMatchedProposal] = useState<ExploreResponse['matchedProposal']>(null)
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
        setMatchedProposal(data.matchedProposal)
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
  const targetRolePluralLabel = viewerRole === 'student' ? 'profesores' : 'estudiantes'
  const matchedCounterpartLabel = viewerRole === 'student' ? 'Tutor/a' : 'Estudiante'

  if (matchedProposal) {
    return (
      <div className="flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-xl overflow-hidden rounded-4xl border border-border bg-card shadow-2xl shadow-gray-200/50 p-8">
          <h2 className="text-xl font-black text-foreground">Tu TFE en curso</h2>

          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700">Resumen</p>
            <h3 className="text-lg font-bold text-foreground">{matchedProposal.title}</h3>
            <p className="text-sm text-foreground/80">
              {matchedProposal.description || 'Sin descripción adicional.'}
            </p>
            <p className="text-xs text-muted-foreground">
              {matchedCounterpartLabel}: {matchedProposal.counterpartName} {matchedProposal.counterpartSurname}
            </p>
            <div className="flex flex-wrap gap-2">
              {matchedProposal.tags.length > 0 ? matchedProposal.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-foreground border border-border/60">
                  {tag}
                </span>
              )) : (
                <span className="text-xs text-muted-foreground">Sin etiquetas</span>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate(`/proposals/details/${matchedProposal.id}`)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
            >
              <FileText size={14} />
              Ver detalles del TFE
            </button>
            <button
              type="button"
              onClick={() => navigate(`/users/${matchedProposal.counterpartId}`)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity"
            >
              <User size={14} />
              Ver perfil de {matchedCounterpartLabel.toLowerCase()}
            </button>
          </div>
        </div>
      </div>
    )
  }

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
      const status = (likeError as { response?: { status?: number } }).response?.status

      if (status === 409 || status === 404) {
        setProposals((previous) => previous.map((proposal, index) => {
          if (index !== currentIndex) {
            return proposal
          }

          return {
            ...proposal,
            liked: true,
            matchStatus: 'rejected',
          }
        }))
        setCurrentIndex((prev) => prev + 1)
        return
      }

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
          <p className="mt-2 text-sm text-muted-foreground">Vuelve más tarde para descubrir nuevos TFEs de {targetRolePluralLabel}.</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Si quieres que aparezcan más resultados, actualiza tus intereses en tu perfil.
          </p>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity"
          >
            Ir a mi perfil
          </button>
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
            <Briefcase size={14} /> TFE Publicado
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
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
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
            <p className="mt-3 text-center text-xs text-emerald-600 font-medium">¡Es un match! Ya podéis contactar por correo.</p>
          )}
          {currentProposal.matchStatus === 'rejected' && (
            <p className="mt-3 text-center text-xs text-rose-600 font-medium">La propuesta no está disponible para match actualmente.</p>
          )}
        </div>
      </div>
    </div>
  )
}