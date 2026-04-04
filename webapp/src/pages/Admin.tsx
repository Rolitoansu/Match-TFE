import { useState } from 'react'
import { Shield, Tag, Users, BookOpen } from 'lucide-react'
import { AdminTagsTab } from './admin/AdminTagsTab'
import { AdminStudentsTab } from './admin/AdminStudentsTab'
import { AdminProfessorsTab } from './admin/AdminProfessorsTab'
import { AdminUsersTab } from './admin/AdminUsersTab'
import { useTranslation } from 'react-i18next'

type Tab = 'tags' | 'students' | 'professors' | 'users'

export default function Admin() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('tags')

  return (
    <div className="min-h-screen bg-background py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center justify-between sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t('admin.page.title')}</h1>
          </div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-border sm:mb-8 sm:gap-4">
          {(['tags', 'students', 'professors', 'users'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-3 py-3 text-sm font-semibold transition-smooth sm:px-4 sm:text-base ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'tags' && <span className="flex items-center gap-2"><Tag size={18} /> {t('admin.page.tabs.tags')}</span>}
              {tab === 'students' && <span className="flex items-center gap-2"><Users size={18} /> {t('admin.page.tabs.students')}</span>}
              {tab === 'professors' && <span className="flex items-center gap-2"><BookOpen size={18} /> {t('admin.page.tabs.professors')}</span>}
              {tab === 'users' && <span className="flex items-center gap-2"><Users size={18} /> {t('admin.page.tabs.users')}</span>}
            </button>
          ))}
        </div>

        {activeTab === 'tags' && <AdminTagsTab />}
        {activeTab === 'students' && <AdminStudentsTab />}
        {activeTab === 'professors' && <AdminProfessorsTab />}
        {activeTab === 'users' && <AdminUsersTab />}
      </div>
    </div>
  )
}
