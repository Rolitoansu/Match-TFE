import { Mail } from 'lucide-react'
import type { User } from '../../../context/AuthContext'
import type { ProfileData, TagOption } from '../types'
import { AboutMeEditor } from './AboutMeEditor'
import { InterestsEditor } from './InterestsEditor'
import { NotificationPreferencesEditor } from './NotificationPreferencesEditor'
import { useTranslation } from 'react-i18next'

interface OwnProfileSidebarProps {
  user: User
  proposalsCount: number
  profileData: ProfileData
  availableTags: TagOption[]
  onSaveBiography: (biography: string) => Promise<boolean>
  onSaveInterests: (interests: string[]) => Promise<boolean>
  onSaveNotificationPreferences: (
    notificationFrequency: ProfileData['notificationFrequency'],
    notificationReminderHour: number,
  ) => Promise<boolean>
}

export function OwnProfileSidebar({
  user,
  proposalsCount,
  profileData,
  availableTags,
  onSaveBiography,
  onSaveInterests,
  onSaveNotificationPreferences,
}: OwnProfileSidebarProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6 xl:col-span-4">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="mb-1 text-xs font-semibold text-primary">
            {user.role === 'professor' ? t('ownProfile.roles.professor') : t('ownProfile.roles.student')}
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-full bg-secondary/50 px-3 py-1 text-[11px] text-muted-foreground">
            <Mail size={11} />
            <span>{user.email}</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-2 border-y border-border/50 py-6 text-center">
          <div>
            <p className="text-lg font-bold">{proposalsCount}</p>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">TFEs</p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <AboutMeEditor biography={profileData.biography ?? ''} onSave={onSaveBiography} />

          <InterestsEditor
            selectedInterests={profileData.interests ?? []}
            availableTags={availableTags}
            onSave={onSaveInterests}
          />

          <NotificationPreferencesEditor
            frequency={profileData.notificationFrequency}
            reminderHour={profileData.notificationReminderHour}
            onSave={onSaveNotificationPreferences}
          />
        </div>
      </div>
    </div>
  )
}
