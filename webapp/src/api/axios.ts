import type { User } from '../context/AuthContext'
import { createApiClient, type ApiHandler } from './createApiClient'

let authHandlers: ApiHandler<User> = { 
  success: () => {}, 
  failure: () => {} 
}

export function setupHandlers(
  onAuthSuccess: (user: User) => void,
  onAuthFailure: (error: Error) => void
) {
  authHandlers = { success: onAuthSuccess, failure: onAuthFailure }
}

const api = createApiClient('accessToken', authHandlers)

export default api
