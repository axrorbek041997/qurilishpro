import { create } from 'zustand'
import { api, setAccessToken, setRefreshToken, getRefreshToken, clearTokens } from '../services/api'

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
    const storedRefresh = getRefreshToken()
    if (!storedRefresh) {
      set({ user: null, isInitialized: true })
      return
    }
    try {
      const { data } = await api.post<{ accessToken: string; refreshToken: string; user: AuthUser }>(
        '/auth/refresh',
        { refreshToken: storedRefresh },
      )
      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      set({ user: data.user, isInitialized: true })
    } catch {
      clearTokens()
      set({ user: null, isInitialized: true })
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post<{ accessToken: string; refreshToken: string; user: AuthUser }>('/auth/login', {
        email,
        password,
      })
      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
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
      clearTokens()
      set({ user: null })
    }
  },
}))

// Listen for forced logout events (triggered by axios interceptor on refresh fail)
window.addEventListener('auth:logout', () => {
  clearTokens()
  useAuthStore.setState({ user: null })
})
