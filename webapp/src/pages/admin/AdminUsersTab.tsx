import { useState, useEffect } from 'react'
import { Users, Loader2, X, Save } from 'lucide-react'
import adminApi from '../../api/adminAxios'
import type { User } from '../../utils/adminHelpers.ts'
import { useTranslation } from 'react-i18next'

export function AdminUsersTab() {
  const { t, i18n } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'student' | 'professor'>('all')
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setUsersLoading(true)
    try {
      const { data } = await adminApi.get('/admin/users')
      setUsers(data.users ?? [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setUsersLoading(false)
    }
  }

  async function updateUser(userId: number, updates: Partial<User>) {
    try {
      const { data } = await adminApi.patch(`/admin/users/${userId}`, updates)
      setUsers(prev => prev.map(u => u.id === userId ? data.user : u))
      setEditingUserId(null)
      setEditingUser(null)
    } catch {
      alert(t('admin.users.alerts.updateError'))
    }
  }

  async function deleteUser(userId: number, email: string) {
    if (!confirm(t('admin.users.confirm.deleteOne', { email }))) return
    try {
      await adminApi.delete(`/admin/users/${userId}`)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setSelectedUsers(prev => {
        const updated = new Set(prev)
        updated.delete(userId)
        return updated
      })
    } catch {
      alert(t('admin.users.alerts.deleteError'))
    }
  }

  async function deleteSelectedUsers() {
    if (selectedUsers.size === 0) return
    if (!confirm(t('admin.users.confirm.deleteMany', { count: selectedUsers.size }))) return

    try {
      for (const id of selectedUsers) {
        await adminApi.delete(`/admin/users/${id}`)
      }
      setUsers(prev => prev.filter(u => !selectedUsers.has(u.id)))
      setSelectedUsers(new Set())
    } catch {
      alert(t('admin.users.alerts.deleteManyError'))
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesFilter = userFilter === 'all' || u.role === userFilter
    const matchesSearch = u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                         u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                         u.surname.toLowerCase().includes(userSearch.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold">
        <Users className="text-primary" size={20} />
        {t('admin.users.title')}
      </h2>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <input
          type="text"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          placeholder={t('admin.users.searchPlaceholder')}
          className="flex-1 rounded-xl border border-input bg-background px-4 py-2 text-sm transition-smooth"
        />
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value as any)}
          className="rounded-xl border border-input bg-background px-4 py-2 text-sm transition-smooth"
        >
          <option value="all">{t('admin.users.filters.all')}</option>
          <option value="student">{t('admin.users.filters.students')}</option>
          <option value="professor">{t('admin.users.filters.professors')}</option>
        </select>
      </div>

      {usersLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
      ) : filteredUsers.length > 0 ? (
        <>
          {selectedUsers.size > 0 && (
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3 animate-slideInDown sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-semibold text-red-700">{t('admin.users.selectedCount', { count: selectedUsers.size })}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedUsers(new Set())}
                  className="rounded px-3 py-1 bg-red-200 text-red-800 text-xs hover:bg-red-300 transition-smooth"
                >
                    {t('admin.users.actions.unselect')}
                </button>
                <button
                  onClick={deleteSelectedUsers}
                  className="rounded px-3 py-1 bg-red-500 text-white text-xs hover:opacity-90 transition-smooth"
                >
                    {t('admin.users.actions.deleteSelected')}
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-170 text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-bold w-12">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.has(u.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
                        } else {
                          setSelectedUsers(new Set())
                        }
                      }}
                      className="w-4 h-4 cursor-pointer accent-red-500 transition-smooth"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-bold">Email</th>
                  <th className="px-4 py-3 text-left font-bold">{t('admin.users.table.name')}</th>
                  <th className="px-4 py-3 text-left font-bold">{t('admin.users.table.type')}</th>
                  <th className="px-4 py-3 text-left font-bold">{t('admin.users.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className={`border-t border-border transition-smooth ${
                    selectedUsers.has(user.id) ? 'bg-red-50' : 'hover:bg-muted/50'
                  }`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={(e) => {
                          const updated = new Set(selectedUsers)
                          if (e.target.checked) {
                            updated.add(user.id)
                          } else {
                            updated.delete(user.id)
                          }
                          setSelectedUsers(updated)
                        }}
                        className="w-4 h-4 cursor-pointer accent-red-500 transition-smooth"
                      />
                    </td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.name} {user.surname}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.role === 'student' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                          {user.role === 'student' ? t('admin.users.roles.student') : t('admin.users.roles.professor')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setEditingUserId(user.id)
                          setEditingUser(user)
                        }}
                        className="rounded px-3 py-1 bg-blue-500 text-white text-xs hover:opacity-90 transition-smooth"
                      >
                        {t('admin.users.actions.edit')}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id, user.email)}
                        className="rounded px-3 py-1 bg-red-500 text-white text-xs hover:opacity-90 transition-smooth"
                      >
                        {t('admin.users.actions.delete')}
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-center text-muted-foreground py-8">{t('admin.users.empty')}</p>
      )}

      {editingUserId && editingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto animate-slideInScale">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{t('admin.users.modal.title')}</h3>
              <button
                onClick={() => {
                  setEditingUserId(null)
                  setEditingUser(null)
                }}
                className="text-muted-foreground hover:text-foreground transition-smooth-fast"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Email</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">{t('admin.users.fields.name')}</label>
                <input
                  type="text"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">{t('admin.users.fields.surname')}</label>
                <input
                  type="text"
                  value={editingUser.surname || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, surname: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">{t('admin.users.fields.biography')}</label>
                <textarea
                  value={editingUser.biography || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, biography: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth resize-none"
                  rows={4}
                  placeholder={t('admin.users.fields.biographyPlaceholder')}
                />
              </div>

              <div className="pt-2 pb-4">
                <div className="text-xs text-muted-foreground">
                  <p><strong>{t('admin.users.fields.userType')} </strong>{editingUser.role === 'student' ? t('admin.users.roles.student') : t('admin.users.roles.professor')}</p>
                  <p><strong>{t('admin.users.fields.registered')} </strong>{new Date(editingUser.registrationDate || '').toLocaleDateString(i18n.resolvedLanguage?.startsWith('es') ? 'es-ES' : 'en-US')}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => {
                  updateUser(editingUserId, {
                    name: editingUser.name,
                    surname: editingUser.surname,
                    email: editingUser.email,
                    biography: editingUser.biography,
                  })
                }}
                className="flex-1 rounded-lg bg-primary text-white font-semibold py-2.5 hover:opacity-90 transition-smooth flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {t('admin.users.actions.saveChanges')}
              </button>
              <button
                onClick={() => {
                  setEditingUserId(null)
                  setEditingUser(null)
                }}
                className="flex-1 rounded-lg border border-input bg-background font-semibold py-2.5 hover:bg-muted transition-smooth"
              >
                {t('admin.users.actions.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
