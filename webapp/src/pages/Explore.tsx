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
import { useTranslation } from 'react-i18next'

type MatchStatus = 'pending' | 'accepted' | 'rejected' | null

interface ExploreProposal {
  id: number
  title: string
  description: string | null
  type: number
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
    type: number
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
  const { t } = useTranslation()
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
        setError(t('explore.errors.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchExplore()
  }, [])

  const currentProposal = useMemo(() => proposals[currentIndex] ?? null, [proposals, currentIndex])

  const profileTypeLabel = viewerRole === 'student'
    ? t('explore.roles.professor')
    : t('explore.roles.student')
  const targetRolePluralLabel = viewerRole === 'student'
    ? t('explore.roles.professorsPlural')
    : t('explore.roles.studentsPlural')
  const matchedCounterpartLabel = viewerRole === 'student'
    ? t('explore.roles.supervisor')
    : t('explore.roles.student')
  const tfgTypeLabelById: Record<number, string> = {
    1: t('tfgTypes.research'),
    2: t('tfgTypes.hardwareSoftwareDevelopment'),
    3: t('tfgTypes.professionalExperience'),
    4: t('tfgTypes.qualitySecuritySystemsDesignAndImplementation'),
    5: t('tfgTypes.specificHardwareSoftwareImplementation'),
    6: t('tfgTypes.otherWorks'),
  }

  if (matchedProposal) {
    return (
      <div className="flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-xl overflow-hidden rounded-4xl border border-border bg-card p-5 shadow-2xl shadow-gray-200/50 sm:p-8">
          <h2 className="text-xl font-black text-foreground">{t('explore.matched.title')}</h2>

          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700">{t('explore.matched.summary')}</p>
            <h3 className="text-lg font-bold text-foreground">{matchedProposal.title}</h3>
            <p className="text-xs font-semibold text-muted-foreground">
              {t('explore.card.tfgType')}: {tfgTypeLabelById[matchedProposal.type] ?? t('tfgTypes.otherWorks')}
            </p>
            <p className="text-sm text-foreground/80">
              {matchedProposal.description || t('explore.common.noDescription')}
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
                <span className="text-xs text-muted-foreground">{t('explore.common.noTags')}</span>
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
              {t('explore.matched.viewDetails')}
            </button>
            <button 
              type="button"
              onClick={() => navigate(`/users/${matchedProposal.counterpartId}`)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity"
            >
              <User size={14} />
              {t('explore.matched.viewProfile', { role: matchedCounterpartLabel.toLowerCase() })}
            </button>
          </div>
        </div>
      </div>
    )
  }

  async function likeCurrentProposal() {
    if (!currentProposal || loadingLike || currentProposal.liked) {
      return
    }

    const proposalId = currentProposal.id

    try {
      setLoadingLike(true)
      setProposals((previous) => previous.map((proposal, index) => {
        if (index !== currentIndex) {
          return proposal
        }

        return {
          ...proposal,
          liked: true,
          matchStatus: 'pending',
        }
      }))

      const { data } = await api.post<{ liked: boolean; matchStatus: MatchStatus }>(`/project/proposals/${currentProposal.id}/like`)

      setProposals((previous) => previous.map((proposal) => {
        if (proposal.id !== proposalId) {
          return proposal
        }

        return {
          ...proposal,
          liked: data.liked,
          matchStatus: data.matchStatus,
        }
      }))

      setCurrentIndex((previous) => previous + 1)
    } catch (likeError) {
      setProposals((previous) => previous.map((proposal) => {
        if (proposal.id !== proposalId) {
          return proposal
        }

        return {
          ...proposal,
          liked: false,
          matchStatus: null,
        }
      }))
      console.error(likeError)
      setError(t('explore.errors.like'))
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
        setError(t('explore.errors.pass'))
      })
      .finally(() => {
        setLoadingLike(false)
      })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-sm rounded-4xl border border-border p-8 text-center shadow-2xl shadow-gray-200/50 sm:max-w-md sm:bg-card sm:p-10">
          <p className="text-sm text-muted-foreground">{t('explore.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-sm rounded-4xl border border-border p-8 text-center shadow-2xl shadow-gray-200/50 sm:max-w-md sm:bg-card sm:p-10">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!currentProposal) {
    return (
      <div className="flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-sm rounded-4xl border border-border p-8 text-center shadow-2xl shadow-gray-200/50 sm:max-w-md sm:bg-card sm:p-10">
          <Sparkles className="mx-auto mb-3 text-primary" size={24} />
          <h2 className="text-lg font-bold text-foreground">{t('explore.empty.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('explore.empty.subtitle', { rolePlural: targetRolePluralLabel })}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t('explore.empty.hint')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity"
          >
            {t('explore.empty.goProfile')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm overflow-hidden rounded-4xl border border-border bg-card shadow-2xl shadow-gray-200/50 sm:max-w-md">

        <div className="relative flex flex-col items-center justify-end bg-primary/5 pb-6 pt-6 sm:pb-8 sm:pt-8">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-32 sm:w-32">
            <GraduationCap size={52} strokeWidth={1.5} className="sm:h-16 sm:w-16" />
          </div>

          <div className="mt-4 px-5 text-center sm:mt-6 sm:px-6">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {currentProposal.creatorName} {currentProposal.creatorSurname}
            </h2>
            <p className="text-muted-foreground">{profileTypeLabel}</p>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <h3 className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
            <Briefcase size={14} /> {t('explore.card.publishedProject')}
          </h3>
          <p className="mt-2 text-lg font-bold text-foreground leading-tight">{currentProposal.title}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {t('explore.card.tfgType')}: {tfgTypeLabelById[currentProposal.type] ?? t('tfgTypes.otherWorks')}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            {currentProposal.description || currentProposal.creatorBiography || t('explore.common.noDescription')}
          </p>

          <div className="mt-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t('explore.card.tags')}
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
                <span className="text-xs text-muted-foreground">{t('explore.common.noTags')}</span>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              onClick={skipCurrentProposal}
              className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border border-border px-3 py-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
              disabled={loadingLike}
            >
              <X size={16} /> {t('explore.actions.pass')}
            </button>
            <button
              type="button"
              onClick={likeCurrentProposal}
              className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold transition-opacity ${
                currentProposal.liked
                  ? 'border border-border text-foreground'
                  : 'bg-primary text-white hover:opacity-90'
              } disabled:opacity-60`}
              disabled={loadingLike || currentProposal.liked || currentProposal.matchStatus === 'accepted'}
            >
              <Heart size={16} />
              {currentProposal.matchStatus === 'accepted'
                ? t('explore.actions.matched')
                : currentProposal.liked
                  ? t('explore.actions.liked')
                  : t('explore.actions.like')}
            </button>
          </div>

          <p className="mt-4 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
            {Math.min(currentIndex + 1, proposals.length)} de {proposals.length}
          </p>
        </div>
      </div>
    </div>
  )
}