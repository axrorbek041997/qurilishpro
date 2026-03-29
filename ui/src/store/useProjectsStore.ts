import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Project, ProjectSchema } from '../types'
import { api } from '../services/api'

// Schema file content: stored in memory (per session, DXF/SVG as text, PDF/image as URL)
const schemaContentMap = new Map<string, string>()

export function getSchemaContent(schemaId: string): string | undefined {
  return schemaContentMap.get(schemaId)
}

export function setSchemaContent(schemaId: string, content: string): void {
  schemaContentMap.set(schemaId, content)
}

export function removeSchemaContent(schemaId: string): void {
  schemaContentMap.delete(schemaId)
}

interface ProjectsState {
  projects: Project[]
  activeProjectId: string
  isLoading: boolean

  fetchProjects: () => Promise<void>
  createProject: (data: Omit<Project, 'id' | 'schemas'>) => Promise<string>
  updateProject: (id: string, data: Partial<Omit<Project, 'id' | 'schemas'>>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setActiveProject: (id: string) => void

  addSchema: (projectId: string, file: File) => Promise<void>
  removeSchema: (projectId: string, schemaId: string) => Promise<void>
  fetchSchemaContent: (projectId: string, schema: ProjectSchema) => Promise<string>

  getActiveProject: () => Project | undefined
  getProject: (id: string) => Project | undefined
}

function mapProject(raw: Project & { _id?: string }): Project {
  return {
    id: raw.id ?? raw._id ?? '',
    name: raw.name,
    location: raw.location,
    startDate: raw.startDate,
    endDate: raw.endDate,
    status: raw.status,
    description: raw.description,
    budget: raw.budget,
    schemas: (raw.schemas ?? []).map((s: ProjectSchema & { _id?: string }) => ({
      id: s.id ?? s._id ?? '',
      name: s.name,
      fileType: s.fileType,
      size: s.size,
      uploadedAt: s.uploadedAt,
    })),
  }
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: '',
      isLoading: false,

      fetchProjects: async () => {
        set({ isLoading: true })
        try {
          const { data } = await api.get<{ data: Project[] }>('/projects')
          const projects = data.data.map(mapProject)
          set({ projects, isLoading: false })
          // Keep activeProjectId valid
          const { activeProjectId } = get()
          if (activeProjectId && !projects.find((p) => p.id === activeProjectId)) {
            set({ activeProjectId: projects[0]?.id ?? '' })
          } else if (!activeProjectId && projects.length > 0) {
            set({ activeProjectId: projects[0].id })
          }
        } catch {
          set({ isLoading: false })
          throw new Error('Failed to fetch projects')
        }
      },

      createProject: async (data) => {
        const { data: res } = await api.post<{ data: Project }>('/projects', data)
        const project = mapProject(res.data)
        set((s) => ({
          projects: [project, ...s.projects],
          activeProjectId: s.activeProjectId || project.id,
        }))
        return project.id
      },

      updateProject: async (id, data) => {
        const { data: res } = await api.put<{ data: Project }>(`/projects/${id}`, data)
        const updated = mapProject(res.data)
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? updated : p)),
        }))
      },

      deleteProject: async (id) => {
        // Optimistic
        const { projects, activeProjectId } = get()
        const remaining = projects.filter((p) => p.id !== id)
        const project = projects.find((p) => p.id === id)
        project?.schemas.forEach((s) => removeSchemaContent(s.id))

        let newActiveId = activeProjectId
        if (activeProjectId === id) newActiveId = remaining[0]?.id ?? ''

        set({ projects: remaining, activeProjectId: newActiveId })

        try {
          await api.delete(`/projects/${id}`)
        } catch {
          // Revert
          set({ projects, activeProjectId })
          throw new Error('Failed to delete project')
        }
      },

      setActiveProject: (id) => set({ activeProjectId: id }),

      addSchema: async (projectId, file) => {
        const formData = new FormData()
        formData.append('file', file)
        const { data: res } = await api.post<{ data: Project }>(`/projects/${projectId}/schemas`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        const updated = mapProject(res.data)
        set((s) => ({
          projects: s.projects.map((p) => (p.id === projectId ? updated : p)),
        }))
      },

      removeSchema: async (projectId, schemaId) => {
        removeSchemaContent(schemaId)
        // Optimistic
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, schemas: p.schemas.filter((sc) => sc.id !== schemaId) } : p
          ),
        }))
        try {
          await api.delete(`/projects/${projectId}/schemas/${schemaId}`)
        } catch {
          // Revert by refetching
          await get().fetchProjects()
          throw new Error('Failed to delete schema')
        }
      },

      fetchSchemaContent: async (projectId, schema) => {
        const cached = schemaContentMap.get(schema.id)
        if (cached) return cached

        const isText = schema.fileType === 'dxf' || schema.fileType === 'svg'
        const url = `${api.defaults.baseURL}/projects/${projectId}/schemas/${schema.id}/file`

        if (isText) {
          const { data } = await api.get<string>(`/projects/${projectId}/schemas/${schema.id}/file`, {
            responseType: 'text',
          })
          setSchemaContent(schema.id, data)
          return data
        } else {
          // For PDF/images: return the direct URL (browser handles it)
          setSchemaContent(schema.id, url)
          return url
        }
      },

      getActiveProject: () => {
        const { projects, activeProjectId } = get()
        return projects.find((p) => p.id === activeProjectId)
      },

      getProject: (id) => get().projects.find((p) => p.id === id),
    }),
    {
      name: 'projects-store',
      partialize: (state) => ({ activeProjectId: state.activeProjectId }),
    },
  ),
)
