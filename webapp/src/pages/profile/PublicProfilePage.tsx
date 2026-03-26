import { ArrowLeft, Hash, FileText, Calendar, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import type { PublicProfile } from './types'
import { ROLE_LABEL, STATUS_COLOR, STATUS_LABEL } from './types'
import { useTranslation } from 'react-i18next'

interface PublicProfilePageProps {
  id: string
}

export default function PublicProfilePage({ id }: PublicProfilePageProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchPublicProfile() {
      setLoading(true)

      try {
        const { data } = await api.get(`/user/${id}`)
        setProfile(data.user)
      } catch (error) {
        console.error('Error fetching public profile:', error)
        navigate(-1)
      } finally {
        setLoading(false)
      }
    }

    fetchPublicProfile()
  }, [id, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-10 pb-32">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-semibold"
        >
          <ArrowLeft size={20} /> {t('publicProfile.back')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-2xl font-bold">{profile.name} {profile.surname}</h2>
              <p className="text-primary font-semibold text-sm mt-1">{ROLE_LABEL[profile.role]}</p>

              {profile.email && (
                <div className="mt-2 flex flex-col items-center gap-2">
                  <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                    <Mail size={12} />
                    {profile.email}
                  </p>
                  <a
                    href={`mailto:${profile.email}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                  >
                    <Mail size={12} />
                    {t('publicProfile.sendEmail')}
                  </a>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                <Calendar size={12} />
                {t('publicProfile.memberSince')} {new Date(profile.registrationDate).toLocaleDateString(i18n.resolvedLanguage?.startsWith('es') ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long' })}
              </p>
            </div>

            {profile.biography && (
              <div className="mt-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                  {t('publicProfile.about')}
                </h3>
                <p className="text-sm leading-relaxed text-foreground/80 italic">
                  "{profile.biography}"
                </p>
              </div>
            )}

            {profile.interests.length > 0 && (
              <div className="mt-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Hash size={10} /> {t('publicProfile.interests')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-semibold border border-primary/15"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <FileText size={16} /> {t('publicProfile.proposalsTitle')}
          </h3>

          {profile.proposals.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground text-sm">
              {t('publicProfile.noProposals')}
            </div>
          ) : (
            profile.proposals.map((proposal) => (
              <button
                key={proposal.id}
                type="button"
                onClick={() => navigate(`/proposals/details/${proposal.id}`)}
                className="w-full text-left rounded-3xl border border-border bg-card p-6 shadow-sm hover:border-primary/30 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-bold text-foreground leading-snug">{proposal.title}</h4>
                  <span className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${STATUS_COLOR[proposal.status]}`}>
                    {STATUS_LABEL[proposal.status]}
                  </span>
                </div>
                {proposal.description && (
                  <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2">
                    {proposal.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(proposal.publicationDate).toLocaleDateString('es-ES')}
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
