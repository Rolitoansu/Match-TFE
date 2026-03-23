export interface Proposal {
  id: number
  title: string
  description: string
  type: number
  publicationDate: string
  status: string
  tags: string[]
}

export interface TagOption {
  id: number
  name: string
}

export interface ProfileData {
  id: number
  biography: string | null
  interests: string[]
  notificationFrequency: 'disabled' | 'daily' | 'weekly' | 'biweekly' | 'monthly'
  notificationReminderHour: number
}

export interface PublicProfile {
  id: number
  name: string
  surname: string
  email: string | null
  biography: string | null
  role: 'student' | 'professor'
  registrationDate: string
  interests: string[]
  proposals: Array<{
    id: number
    title: string
    description: string
    type: number
    status: 'proposed' | 'in_progress' | 'completed'
    publicationDate: string
  }>
}

export const STATUS_LABEL = {
  proposed: 'Abierta',
  in_progress: 'En curso',
  completed: 'Finalizada',
} as const

export const STATUS_COLOR = {
  proposed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
} as const

export const ROLE_LABEL = {
  student: 'Estudiante',
  professor: 'Profesor/a',
} as const
