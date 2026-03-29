import { create } from 'zustand'
import { Worker, AttendanceRecord } from '../types'
import { api } from '../services/api'
import { format } from 'date-fns'

interface WorkersState {
  workers: Worker[]
  attendance: AttendanceRecord[]
  isLoading: boolean

  fetchWorkers: (projectId: string) => Promise<void>
  fetchAttendance: (date: string, projectId: string, to?: string) => Promise<void>

  getWorkersForProject: (projectId: string) => Worker[]
  getAttendanceForDate: (date: string, projectId?: string) => AttendanceRecord[]
  isPresent: (workerId: string, date?: string) => boolean

  addWorker: (worker: Omit<Worker, 'id'>) => Promise<void>
  updateWorker: (id: string, data: Partial<Worker>) => Promise<void>
  removeWorker: (id: string) => Promise<void>
  removeWorkersForProject: (projectId: string) => void

  toggleAttendance: (workerId: string, date?: string) => Promise<void>
  setAllPresent: (projectId: string, date?: string) => Promise<void>
  setAllAbsent: (projectId: string, date?: string) => Promise<void>
}

function mapWorker(raw: Worker & { _id?: string }): Worker {
  return {
    id: raw.id ?? raw._id ?? '',
    name: raw.name,
    role: raw.role,
    dailyWage: raw.dailyWage,
    phone: raw.phone,
    projectId: raw.projectId,
  }
}

function mapAttendance(raw: AttendanceRecord & { _id?: string }): AttendanceRecord {
  return {
    id: raw.id ?? raw._id ?? '',
    workerId: raw.workerId,
    date: raw.date,
    present: raw.present,
    overtimeHours: raw.overtimeHours,
  }
}

export const useWorkersStore = create<WorkersState>((set, get) => ({
  workers: [],
  attendance: [],
  isLoading: false,

  fetchWorkers: async (projectId) => {
    set({ isLoading: true })
    try {
      const { data } = await api.get<{ data: Worker[] }>('/workers', { params: { projectId } })
      set((s) => {
        // Remove workers for this project, then add fresh ones
        const other = s.workers.filter((w) => w.projectId !== projectId)
        return { workers: [...other, ...data.data.map(mapWorker)], isLoading: false }
      })
    } catch {
      set({ isLoading: false })
      throw new Error('Failed to fetch workers')
    }
  },

  fetchAttendance: async (date, projectId, to) => {
    try {
      const params: Record<string, string> = { projectId }
      if (to) { params.from = date; params.to = to }
      else { params.date = date }
      const { data } = await api.get<{ data: AttendanceRecord[] }>('/workers/attendance', { params })
      set((s) => {
        // Remove attendance for this project+date, then add fresh ones
        const other = s.attendance.filter((a) => {
          const workerIds = new Set(
            s.workers.filter((w) => w.projectId === projectId).map((w) => w.id)
          )
          return !(a.date === date && workerIds.has(a.workerId))
        })
        return { attendance: [...other, ...data.data.map(mapAttendance)] }
      })
    } catch {
      throw new Error('Failed to fetch attendance')
    }
  },

  getWorkersForProject: (projectId) => get().workers.filter((w) => w.projectId === projectId),

  getAttendanceForDate: (date, projectId) => {
    const records = get().attendance.filter((a) => a.date === date)
    if (!projectId) return records
    const projectWorkerIds = new Set(
      get().workers.filter((w) => w.projectId === projectId).map((w) => w.id)
    )
    return records.filter((a) => projectWorkerIds.has(a.workerId))
  },

  isPresent: (workerId, date) => {
    const d = date ?? format(new Date(), 'yyyy-MM-dd')
    return get().attendance.find((a) => a.workerId === workerId && a.date === d)?.present ?? false
  },

  addWorker: async (worker) => {
    const { data } = await api.post<{ data: Worker }>('/workers', worker)
    set((s) => ({ workers: [...s.workers, mapWorker(data.data)] }))
  },

  updateWorker: async (id, data) => {
    const { data: res } = await api.put<{ data: Worker }>(`/workers/${id}`, data)
    set((s) => ({ workers: s.workers.map((w) => (w.id === id ? mapWorker(res.data) : w)) }))
  },

  removeWorker: async (id) => {
    // Optimistic
    const prev = get().workers
    set((s) => ({
      workers: s.workers.filter((w) => w.id !== id),
      attendance: s.attendance.filter((a) => a.workerId !== id),
    }))
    try {
      await api.delete(`/workers/${id}`)
    } catch {
      set({ workers: prev })
      throw new Error('Failed to remove worker')
    }
  },

  removeWorkersForProject: (projectId) => {
    const toRemove = new Set(get().workers.filter((w) => w.projectId === projectId).map((w) => w.id))
    set((s) => ({
      workers: s.workers.filter((w) => !toRemove.has(w.id)),
      attendance: s.attendance.filter((a) => !toRemove.has(a.workerId)),
    }))
  },

  toggleAttendance: async (workerId, date) => {
    const d = date ?? format(new Date(), 'yyyy-MM-dd')
    const existing = get().attendance.find((a) => a.workerId === workerId && a.date === d)

    // Optimistic update
    if (existing) {
      set((s) => ({
        attendance: s.attendance.map((a) =>
          a.workerId === workerId && a.date === d ? { ...a, present: !a.present } : a
        ),
      }))
    } else {
      const tempRecord: AttendanceRecord = { id: `temp-${Date.now()}`, workerId, date: d, present: true }
      set((s) => ({ attendance: [...s.attendance, tempRecord] }))
    }

    try {
      const { data } = await api.post<{ data: AttendanceRecord }>('/workers/attendance/toggle', {
        workerId, date: d,
      })
      const updated = mapAttendance(data.data)
      set((s) => ({
        attendance: s.attendance.map((a) =>
          a.workerId === workerId && a.date === d ? updated : a
        ),
      }))
    } catch {
      // Revert
      if (existing) {
        set((s) => ({
          attendance: s.attendance.map((a) =>
            a.workerId === workerId && a.date === d ? existing : a
          ),
        }))
      } else {
        set((s) => ({
          attendance: s.attendance.filter((a) => !(a.workerId === workerId && a.date === d)),
        }))
      }
      throw new Error('Failed to toggle attendance')
    }
  },

  setAllPresent: async (projectId, date) => {
    const d = date ?? format(new Date(), 'yyyy-MM-dd')
    const { data } = await api.post<{ data: AttendanceRecord[] }>('/workers/attendance/bulk', {
      projectId, date: d, present: true,
    })
    const updated = data.data.map(mapAttendance)
    set((s) => {
      const workerIds = new Set(updated.map((r) => r.workerId))
      const other = s.attendance.filter((a) => !(a.date === d && workerIds.has(a.workerId)))
      return { attendance: [...other, ...updated] }
    })
  },

  setAllAbsent: async (projectId, date) => {
    const d = date ?? format(new Date(), 'yyyy-MM-dd')
    const { data } = await api.post<{ data: AttendanceRecord[] }>('/workers/attendance/bulk', {
      projectId, date: d, present: false,
    })
    const updated = data.data.map(mapAttendance)
    set((s) => {
      const workerIds = new Set(updated.map((r) => r.workerId))
      const other = s.attendance.filter((a) => !(a.date === d && workerIds.has(a.workerId)))
      return { attendance: [...other, ...updated] }
    })
  },
}))
