import { create } from 'zustand'
import { Material, MaterialTransaction } from '../types'
import { api } from '../services/api'

export interface MaterialStock {
  material: Material
  stock: number
  inTotal: number
  outTotal: number
  isLow: boolean
}

interface MaterialsState {
  materials: Material[]
  transactions: MaterialTransaction[]
  isLoading: boolean

  fetchMaterials: (projectId: string) => Promise<void>
  fetchTransactions: (projectId: string, from?: string, to?: string) => Promise<void>
  fetchStock: (projectId: string) => Promise<MaterialStock[]>

  addMaterial: (material: Omit<Material, 'id'>) => Promise<void>
  removeMaterial: (id: string) => Promise<void>
  removeMaterialsForProject: (projectId: string) => void
  addTransaction: (tx: Omit<MaterialTransaction, 'id'>) => Promise<void>

  getMaterialsForProject: (projectId: string) => Material[]
  getStockForProject: (projectId: string) => MaterialStock[]
  getTransactionsForMaterial: (materialId: string) => MaterialTransaction[]
  getTransactionsForRange: (from: string, to: string, projectId: string) => MaterialTransaction[]
}

function mapMaterial(raw: Material & { _id?: string }): Material {
  return {
    id: raw.id ?? raw._id ?? '',
    name: raw.name,
    unit: raw.unit,
    minStock: raw.minStock,
    projectId: raw.projectId,
  }
}

function mapTransaction(raw: MaterialTransaction & { _id?: string }): MaterialTransaction {
  return {
    id: raw.id ?? raw._id ?? '',
    materialId: raw.materialId,
    type: raw.type,
    quantity: raw.quantity,
    note: raw.note,
    date: raw.date,
    projectId: raw.projectId,
  }
}

export const useMaterialsStore = create<MaterialsState>((set, get) => ({
  materials: [],
  transactions: [],
  isLoading: false,

  fetchMaterials: async (projectId) => {
    set({ isLoading: true })
    try {
      const { data } = await api.get<{ data: Material[] }>('/materials', { params: { projectId } })
      set((s) => {
        const other = s.materials.filter((m) => m.projectId !== projectId)
        return { materials: [...other, ...data.data.map(mapMaterial)], isLoading: false }
      })
    } catch {
      set({ isLoading: false })
      throw new Error('Failed to fetch materials')
    }
  },

  fetchTransactions: async (projectId, from, to) => {
    const params: Record<string, string> = { projectId }
    if (from) params.from = from
    if (to) params.to = to
    const { data } = await api.get<{ data: MaterialTransaction[] }>('/materials/transactions', { params })
    set((s) => {
      const other = s.transactions.filter((t) => t.projectId !== projectId)
      return { transactions: [...other, ...data.data.map(mapTransaction)] }
    })
  },

  fetchStock: async (projectId) => {
    const { data } = await api.get<{ data: MaterialStock[] }>('/materials/stock', { params: { projectId } })
    return data.data
  },

  addMaterial: async (material) => {
    const { data } = await api.post<{ data: Material }>('/materials', material)
    set((s) => ({ materials: [...s.materials, mapMaterial(data.data)] }))
  },

  removeMaterial: async (id) => {
    const prev = get().materials
    set((s) => ({
      materials: s.materials.filter((m) => m.id !== id),
      transactions: s.transactions.filter((t) => t.materialId !== id),
    }))
    try {
      await api.delete(`/materials/${id}`)
    } catch {
      set({ materials: prev })
      throw new Error('Failed to remove material')
    }
  },

  removeMaterialsForProject: (projectId) => {
    const toRemove = new Set(get().materials.filter((m) => m.projectId === projectId).map((m) => m.id))
    set((s) => ({
      materials: s.materials.filter((m) => !toRemove.has(m.id)),
      transactions: s.transactions.filter((t) => !toRemove.has(t.materialId)),
    }))
  },

  addTransaction: async (tx) => {
    const { data } = await api.post<{ data: MaterialTransaction }>('/materials/transactions', tx)
    set((s) => ({ transactions: [mapTransaction(data.data), ...s.transactions] }))
  },

  getMaterialsForProject: (projectId) =>
    get().materials.filter((m) => m.projectId === projectId),

  getStockForProject: (projectId) => {
    const { materials, transactions } = get()
    return materials
      .filter((m) => m.projectId === projectId)
      .map((material) => {
        const txs = transactions.filter((t) => t.materialId === material.id)
        const inTotal = txs.filter((t) => t.type === 'in').reduce((s, t) => s + t.quantity, 0)
        const outTotal = txs.filter((t) => t.type === 'out').reduce((s, t) => s + t.quantity, 0)
        const stock = inTotal - outTotal
        const isLow = material.minStock !== undefined && stock <= material.minStock
        return { material, stock, inTotal, outTotal, isLow }
      })
  },

  getTransactionsForMaterial: (materialId) =>
    get().transactions.filter((t) => t.materialId === materialId),

  getTransactionsForRange: (from, to, projectId) =>
    get().transactions.filter(
      (t) => t.projectId === projectId && t.date >= from && t.date <= to,
    ),
}))
