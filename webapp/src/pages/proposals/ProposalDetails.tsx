import { 
  ArrowLeft, BookOpen, MessageSquare, 
  Hash, GraduationCap, UserCheck, Mail, Heart, Users, RefreshCw
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../api/axios'
import useAuth from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'

interface ProposalDetailsData {
  id: number
  title: string
  description: string
  type: number
  publicationDate: string
  isOwner: boolean
  viewerMatchStatus: 'pending' | 'accepted' | 'rejected' | null
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

export default function ProposalDetails() {
  const { t, i18n } = useTranslation()
  const id = useParams().id
  const navigate = useNavigate()
  const { user } = useAuth()
  const [proposal, setProposal] = useState<ProposalDetailsData | null>(null)
  const [renewing, setRenewing] = useState(false)
  const [renewFeedback, setRenewFeedback] = useState<string | null>(null)
  const [acceptingUserId, setAcceptingUserId] = useState<number | null>(null)
  const [matchFeedback, setMatchFeedback] = useState<string | null>(null)
  const [cancellingExecution, setCancellingExecution] = useState(false)
  const [completingExecution, setCompletingExecution] = useState(false)

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
      const { data: refreshedData } = await api.get(`/project/proposals/${id}`)
      if (refreshedData?.proposal) {
        setProposal(refreshedData.proposal)
      }

      if (data?.expiresAt) {
        setRenewFeedback(t('proposalDetails.feedback.renewExpiresOn', {
          date: new Date(data.expiresAt).toLocaleDateString(i18n.resolvedLanguage),
        }))
      } else {
        setRenewFeedback(t('proposalDetails.feedback.renewSuccess'))
      }
    } catch (error) {
      console.error('Error renewing proposal:', error)
      setRenewFeedback(t('proposalDetails.feedback.renewError'))
    } finally {
      setRenewing(false)
    }
  }

  async function handleAcceptMatch(interestedUserId: number) {
    if (!proposal) return

    setMatchFeedback(null)
    setAcceptingUserId(interestedUserId)

    try {
      await api.post(`/project/proposals/${id}/match/${interestedUserId}`)

      const { data: refreshedData } = await api.get(`/project/proposals/${id}`)
      if (refreshedData?.proposal) {
        setProposal(refreshedData.proposal)
      }

      setMatchFeedback(t('proposalDetails.feedback.acceptMatchSuccess'))
    } catch (error) {
      console.error('Error accepting match:', error)
      setMatchFeedback(t('proposalDetails.feedback.acceptMatchError'))
    } finally {
      setAcceptingUserId(null)
    }
  }

  async function handleCancelExecution() {
    if (!proposal) return

    const shouldCancel = confirm(t('proposalDetails.cancel.confirm'))

    if (!shouldCancel) {
      return
    }

    setMatchFeedback(null)
    setCancellingExecution(true)

    try {
      await api.patch(`/project/proposals/${id}/cancel`)

      const { data: refreshedData } = await api.get(`/project/proposals/${id}`)
      if (refreshedData?.proposal) {
        setProposal(refreshedData.proposal)
      }

      setMatchFeedback(t('proposalDetails.feedback.cancelSuccess'))
    } catch (error) {
      console.error('Error cancelling proposal execution:', error)
      setMatchFeedback(t('proposalDetails.feedback.cancelError'))
    } finally {
      setCancellingExecution(false)
    }
  }

  async function handleCompleteExecution() {
    if (!proposal) return

    const shouldComplete = confirm(t('proposalDetails.complete.confirm'))

    if (!shouldComplete) {
      return
    }

    setMatchFeedback(null)
    setCompletingExecution(true)

    try {
      await api.patch(`/project/proposals/${id}/complete`)

      const { data: refreshedData } = await api.get(`/project/proposals/${id}`)
      if (refreshedData?.proposal) {
        setProposal(refreshedData.proposal)
      }

      setMatchFeedback(t('proposalDetails.feedback.completeSuccess'))
    } catch (error) {
      console.error('Error completing proposal execution:', error)
      setMatchFeedback(t('proposalDetails.feedback.completeError'))
    } finally {
      setCompletingExecution(false)
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

  const canRenew = proposal?.status !== 'completed' && Boolean(proposal?.isOwner || (proposal?.user?.id && user?.id && proposal.user.id === user.id))
  const hasAcceptedMatch = proposal?.interestedUsers.some((person) => person.matchStatus === 'accepted') ?? false
  const canContactProposalOwner = Boolean(!proposal?.isOwner && proposal?.user?.email)
  const canCancelExecution = proposal?.status === 'in_progress' && (proposal.isOwner || proposal.viewerMatchStatus === 'accepted')
  const canCompleteExecution = proposal?.status === 'in_progress' && user?.role === 'professor' && (proposal.isOwner || proposal.viewerMatchStatus === 'accepted')

  function getStatusLabel(status: ProposalDetailsData['status']) {
    return t(`proposalDetails.status.${status}`)
  }

  const tfgTypeLabelById: Record<number, string> = {
    1: t('tfgTypes.research'),
    2: t('tfgTypes.hardwareSoftwareDevelopment'),
    3: t('tfgTypes.professionalExperience'),
    4: t('tfgTypes.qualitySecuritySystemsDesignAndImplementation'),
    5: t('tfgTypes.specificHardwareSoftwareImplementation'),
    6: t('tfgTypes.otherWorks'),
  }

  function getCounterLabel(status: ProposalDetailsData['status']) {
    if (status === 'in_progress') {
      return t('proposalDetails.sidebar.status')
    }

    return t('proposalDetails.sidebar.likesReceived')
  }

  function getCounterValue(status: ProposalDetailsData['status'], interestedCount: number) {
    if (status === 'in_progress') {
      return t('proposalDetails.sidebar.assigned')
    }

    return interestedCount
  }

  function getRenewButtonLabel() {
    if (renewing) {
      return t('proposalDetails.renew.renewing')
    }

    return t('proposalDetails.renew.button')
  }

  function getCancelButtonLabel() {
    if (cancellingExecution) {
      return t('proposalDetails.cancel.cancelling')
    }

    return t('proposalDetails.cancel.button')
  }

  function getCompleteButtonLabel() {
    if (completingExecution) {
      return t('proposalDetails.complete.completing')
    }

    return t('proposalDetails.complete.button')
  }

  function getAcceptButtonLabel(personId: number) {
    if (acceptingUserId === personId) {
      return t('proposalDetails.interested.accepting')
    }

    return t('proposalDetails.interested.accept')
  }

  function getInterestedStatusText(person: ProposalDetailsData['interestedUsers'][number]) {
    if (person.matchStatus === 'accepted') {
      if (person.email) {
        return t('proposalDetails.interested.matchConfirmedWithEmail', { email: person.email })
      }

      return t('proposalDetails.interested.matchConfirmed')
    }

    return t('proposalDetails.interested.likePending')
  }

  function renderProposalIcon(status: ProposalDetailsData['status']) {
    if (status === 'in_progress') {
      return <UserCheck size={40} />
    }

    return <GraduationCap size={40} />
  }

  return proposal && (
    <div className="mx-auto max-w-6xl p-4 pb-24 sm:p-6 sm:pb-32 lg:p-10">
      <div className="mb-6 flex items-center justify-between sm:mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-semibold">
          <ArrowLeft size={20} /> {t('proposalDetails.back')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-blue-100 text-blue-700">
                {getStatusLabel(proposal.status)}
              </span>
              <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{new Date(proposal.publicationDate).toLocaleString()}</span>
            </div>
            
            <h1 className="text-2xl font-black leading-tight text-foreground md:text-4xl">
              {proposal.title}
            </h1>
          </div>

          <section className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <BookOpen size={16} /> {t('proposalDetails.sections.projectDescription')}
            </h3>
            <p className="text-base leading-relaxed text-foreground/80 sm:text-lg">
              {proposal.description}
            </p>
            <p className="text-sm font-semibold text-foreground/80">
              {t('proposalDetails.sections.tfgType')}: {tfgTypeLabelById[proposal.type] ?? t('tfgTypes.otherWorks')}
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
          <div className="sticky top-8 space-y-6 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8">
            
            <div className="space-y-4 text-center">
              <div className="mx-auto h-20 w-20 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                {renderProposalIcon(proposal.status)}
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">{t('proposalDetails.publishedBy')}</p>
                {proposal.user ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/users/${proposal.user!.id}`)}
                    className="text-xl font-bold hover:text-primary transition-colors"
                  >
                    {proposal.user.name} {proposal.user.surname}
                  </button>
                ) : (
                  <h4 className="text-xl font-bold">{t('proposalDetails.authorUnavailable')}</h4>
                )}
                {proposal.user?.email && (
                  <p className="text-sm text-primary font-medium flex items-center justify-center gap-1.5 mt-1">
                    <Mail size={14} /> {proposal.user.email}
                  </p>
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
                  {getRenewButtonLabel()}
                </button>
              )}
              {renewFeedback && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  {renewFeedback}
                </p>
              )}
              {canContactProposalOwner && proposal.user?.email && (
                <a
                  href={`mailto:${proposal.user.email}`}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                >
                  <MessageSquare size={20} />
                  {t('proposalDetails.contactByEmail')}
                </a>
              )}
              {canCancelExecution && (
                <button
                  type="button"
                  onClick={handleCancelExecution}
                  disabled={cancellingExecution}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-amber-300 bg-amber-50 text-amber-800 font-black transition-colors hover:bg-amber-100 disabled:opacity-60"
                >
                  {getCancelButtonLabel()}
                </button>
              )}
              {canCompleteExecution && (
                <button
                  type="button"
                  onClick={handleCompleteExecution}
                  disabled={completingExecution}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-800 font-black transition-colors hover:bg-emerald-100 disabled:opacity-60"
                >
                  {getCompleteButtonLabel()}
                </button>
              )}
              
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-blue-900">
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} /> {getCounterLabel(proposal.status)}
                  </span>
                  <span>{getCounterValue(proposal.status, proposal.interestedUsers.length)}</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {proposal.status !== 'in_progress' && proposal.interestedUsers.length === 0 && (
                    <p className="text-xs text-blue-800/80 text-center py-2">{t('proposalDetails.sidebar.noLikesYet')}</p>
                  )}

                  {proposal.interestedUsers.map((person) => (
                    <div key={person.id} className="rounded-xl border border-blue-200/80 bg-white/80 p-2.5">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Heart size={12} className="text-rose-500" />
                        {person.name} {person.surname}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {getInterestedStatusText(person)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/users/${person.id}`)}
                          className="rounded-lg border border-blue-300 px-2.5 py-1 text-[11px] font-semibold text-blue-800 hover:bg-blue-50"
                        >
                          {t('proposalDetails.interested.viewProfile')}
                        </button>
                        {proposal.isOwner && person.matchStatus === 'accepted' && person.email && (
                          <a
                            href={`mailto:${person.email}`}
                            className="rounded-lg border border-emerald-300 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50"
                          >
                            {t('proposalDetails.interested.sendEmail')}
                          </a>
                        )}
                        {proposal.isOwner && proposal.status === 'proposed' && person.matchStatus === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleAcceptMatch(person.id)}
                            disabled={acceptingUserId !== null || hasAcceptedMatch}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {getAcceptButtonLabel(person.id)}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {matchFeedback && (
                  <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                    {matchFeedback}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}