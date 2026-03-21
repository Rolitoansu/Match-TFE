import api from './axios'

export type NotificationItem = {
  id: number
  type: string
  content: string
  read: boolean
  timestamp: string
}

type NotificationListResponse = {
  notifications: NotificationItem[]
  unreadCount: number
}

export async function fetchNotifications() {
  const { data } = await api.get<NotificationListResponse>('/notifications')
  return data
}

export async function markNotificationAsRead(notificationId: number) {
  await api.patch(`/notifications/${notificationId}/read`)
}

export async function clearNotifications() {
  await api.delete('/notifications')
}

export async function deleteNotification(notificationId: number) {
  await api.delete(`/notifications/${notificationId}`)
}
