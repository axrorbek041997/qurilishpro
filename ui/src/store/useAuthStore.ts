import { create } from 'zustand'
import { api, setAccessToken, clearAccessToken } from '../services/api'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'viewer'
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isInitialized: boolean

  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
  updateCurrentUser: (updates: Partial<AuthUser>) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      // Try to get a new access token using the httpOnly refresh cookie
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>('/auth/refresh')
      setAccessToken(data.accessToken)
      set({ user: data.user, isInitialized: true })
    } catch {
      // No valid refresh cookie — user must log in
      set({ user: null, isInitialized: true })
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', {
        email,
        password,
      })
      setAccessToken(data.accessToken)
      set({ user: data.user, isLoading: false })
    } catch {
      set({ isLoading: false })
      throw new Error('Invalid email or password')
    }
  },

  updateCurrentUser: (updates) => set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // best-effort
    } finally {
      clearAccessToken()
      set({ user: null })
    }
  },
}))

// Listen for forced logout events (triggered by axios interceptor on refresh fail)
window.addEventListener('auth:logout', () => {
  clearAccessToken()
  useAuthStore.setState({ user: null })
})
