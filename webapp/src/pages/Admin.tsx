import { useState } from 'react'
import { Shield, Tag, Users, BookOpen } from 'lucide-react'
import { AdminTagsTab } from './admin/AdminTagsTab'
import { AdminStudentsTab } from './admin/AdminStudentsTab'
import { AdminProfessorsTab } from './admin/AdminProfessorsTab'
import { AdminUsersTab } from './admin/AdminUsersTab'

type Tab = 'tags' | 'students' | 'professors' | 'users'

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('tags')

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
          </div>
        </div>

        <div className="mb-8 flex gap-4 border-b border-border">
          {(['tags', 'students', 'professors', 'users'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold transition-smooth ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'tags' && <span className="flex items-center gap-2"><Tag size={18} /> Etiquetas</span>}
              {tab === 'students' && <span className="flex items-center gap-2"><Users size={18} /> Estudiantes</span>}
              {tab === 'professors' && <span className="flex items-center gap-2"><BookOpen size={18} /> Profesores</span>}
              {tab === 'users' && <span className="flex items-center gap-2"><Users size={18} /> Gestionar Usuarios</span>}
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
