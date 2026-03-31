import { create } from 'zustand'
import { api } from '../services/api'
import { AppUser } from '../types'
import { useAuthStore } from './useAuthStore'

interface UsersState {
  users: AppUser[]
  isLoading: boolean

  fetchUsers: () => Promise<void>
  createUser: (data: { email: string; name: string; password: string; role: string }) => Promise<void>
  updateUser: (id: string, data: { email?: string; name?: string; password?: string; role?: string }) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  updateProfile: (data: { name?: string; password?: string }) => Promise<void>
}

function mapUser(raw: AppUser & { _id?: string }): AppUser {
  return {
    id: raw.id ?? raw._id ?? '',
    email: raw.email,
    name: raw.name,
    role: raw.role,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  isLoading: false,

  fetchUsers: async () => {
    set({ isLoading: true })
    try {
      const { data } = await api.get<{ data: AppUser[] }>('/users')
      set({ users: data.data.map(mapUser), isLoading: false })
    } catch {
      set({ isLoading: false })
      throw new Error('Failed to fetch users')
    }
  },

  createUser: async (userData) => {
    const { data } = await api.post<{ data: AppUser }>('/users', userData)
    set((s) => ({ users: [mapUser(data.data), ...s.users] }))
  },

  updateUser: async (id, userData) => {
    const { data } = await api.put<{ data: AppUser }>(`/users/${id}`, userData)
    set((s) => ({ users: s.users.map((u) => (u.id === id ? mapUser(data.data) : u)) }))
  },

  deleteUser: async (id) => {
    const prev = get().users
    set((s) => ({ users: s.users.filter((u) => u.id !== id) }))
    try {
      await api.delete(`/users/${id}`)
    } catch {
      set({ users: prev })
      throw new Error('Failed to delete user')
    }
  },

  updateProfile: async (profileData) => {
    const { data } = await api.put<{ data: AppUser }>('/users/me', profileData)
    if (profileData.name) {
      useAuthStore.getState().updateCurrentUser({ name: data.data.name })
    }
  },
}))
