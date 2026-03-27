import {
  Plus,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import useAuth from '../../hooks/useAuth'
import type { ProfileData, Proposal, TagOption } from './types'
import { useTranslation } from 'react-i18next'
import { OwnProfileSidebar } from './components/OwnProfileSidebar'
import { PublishedProposalsSection } from './components/PublishedProposalsSection'

export default function OwnProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [availableTags, setAvailableTags] = useState<TagOption[]>([])
  const [profileData, setProfileData] = useState<ProfileData>({
    id: 0,
    biography: '',
    interests: [],
    notificationFrequency: 'disabled',
    notificationReminderHour: 9,
  })

  useEffect(() => {
    const userId = user?.id

    if (!userId) {
      return
    }

    async function fetchUserData() {
      try {
        const [proposalsResponse, profileResponse, tagsResponse] = await Promise.all([
          api.get(`/user/proposals/${userId}`),
          api.get('/user/profile'),
          api.get('/project/tags'),
        ])

        setProposals(proposalsResponse.data.proposals)

        const profile: ProfileData = profileResponse.data.user
        setProfileData({
          id: profile.id,
          biography: profile.biography ?? '',
          interests: profile.interests ?? [],
          notificationFrequency: profile.notificationFrequency ?? 'disabled',
          notificationReminderHour: profile.notificationReminderHour ?? 9,
        })

        setAvailableTags(tagsResponse.data.tags ?? [])
      } catch (error) {
        console.error('Error al obtener las propuestas del usuario:', error)
      }
    }

    fetchUserData()
  }, [user?.id])

  useEffect(() => {
    if (typeof user?.biography === 'string') {
      setProfileData((previous) => ({
        ...previous,
        biography: user.biography,
      }))
    }
  }, [user?.biography])

  const saveBiography = async (biography: string) => {
    try {
      await api.patch('/user/profile', { biography: biography || null })
      setProfileData((previous) => ({
        ...previous,
        biography,
      }))
      return true
    } catch (error) {
      console.error('Error actualizando sobre mi:', error)
      return false
    }
  }

  const saveInterests = async (interests: string[]) => {
    try {
      await api.patch('/user/profile', { interests })
      setProfileData((previous) => ({
        ...previous,
        interests,
      }))
      return true
    } catch (error) {
      console.error('Error actualizando intereses:', error)
      return false
    }
  }

  const saveNotificationFrequency = async (
    notificationFrequency: ProfileData['notificationFrequency'],
    notificationReminderHour: number,
  ) => {
    try {
      await api.patch('/user/profile', {
        notificationFrequency,
        notificationReminderHour,
      })
      setProfileData((previous) => ({
        ...previous,
        notificationFrequency,
        notificationReminderHour,
      }))
      return true
    } catch (error) {
      console.error('Error actualizando frecuencia de notificaciones:', error)
      return false
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto max-w-350 p-6 lg:p-10">
      <div className="mb-10 flex items-end justify-between px-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('ownProfile.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('ownProfile.subtitle')}</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90"
          onClick={() => navigate('/proposals/new')}
        >
          <Plus size={18} />
          {t('ownProfile.newProposal')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <OwnProfileSidebar
          user={user}
          proposalsCount={proposals.length}
          profileData={profileData}
          availableTags={availableTags}
          onSaveBiography={saveBiography}
          onSaveInterests={saveInterests}
          onSaveNotificationPreferences={saveNotificationFrequency}
        />

        <div className="space-y-4 xl:col-span-8">
          <PublishedProposalsSection
            proposals={proposals}
            onOpenProposal={(proposalId) => navigate(`/proposals/details/${proposalId}`)}
          />
        </div>
      </div>
    </div>
  )
}
