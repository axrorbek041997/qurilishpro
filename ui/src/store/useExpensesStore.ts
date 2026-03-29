import { create } from 'zustand'
import { Expense } from '../types'
import { api } from '../services/api'

interface ExpensesState {
  expenses: Expense[]
  isLoading: boolean

  fetchExpenses: (projectId: string, from?: string, to?: string) => Promise<void>
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>
  removeExpense: (id: string) => Promise<void>
  removeExpensesForProject: (projectId: string) => void

  getExpensesForDate: (date: string, projectId: string) => Expense[]
  getExpensesForRange: (from: string, to: string, projectId: string) => Expense[]
  getTotalForDate: (date: string, projectId: string) => number
}

function mapExpense(raw: Expense & { _id?: string }): Expense {
  return {
    id: raw.id ?? raw._id ?? '',
    amount: raw.amount,
    category: raw.category,
    note: raw.note,
    date: raw.date,
    imageUrl: raw.imageUrl,
    projectId: raw.projectId,
  }
}

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expenses: [],
  isLoading: false,

  fetchExpenses: async (projectId, from, to) => {
    set({ isLoading: true })
    try {
      const params: Record<string, string> = { projectId }
      if (from) params.from = from
      if (to) params.to = to
      const { data } = await api.get<{ data: Expense[] }>('/expenses', { params })
      set((s) => {
        const other = s.expenses.filter((e) => {
          if (e.projectId !== projectId) return true
          if (from && e.date < from) return true
          if (to && e.date > to) return true
          return false
        })
        return { expenses: [...other, ...data.data.map(mapExpense)], isLoading: false }
      })
    } catch {
      set({ isLoading: false })
      throw new Error('Failed to fetch expenses')
    }
  },

  addExpense: async (expense) => {
    const { data } = await api.post<{ data: Expense }>('/expenses', expense)
    set((s) => ({ expenses: [mapExpense(data.data), ...s.expenses] }))
  },

  removeExpense: async (id) => {
    const prev = get().expenses
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }))
    try {
      await api.delete(`/expenses/${id}`)
    } catch {
      set({ expenses: prev })
      throw new Error('Failed to remove expense')
    }
  },

  removeExpensesForProject: (projectId) => {
    set((s) => ({ expenses: s.expenses.filter((e) => e.projectId !== projectId) }))
  },

  getExpensesForDate: (date, projectId) =>
    get().expenses.filter((e) => e.date === date && e.projectId === projectId),

  getExpensesForRange: (from, to, projectId) =>
    get().expenses.filter(
      (e) => e.projectId === projectId && e.date >= from && e.date <= to,
    ),

  getTotalForDate: (date, projectId) =>
    get()
      .getExpensesForDate(date, projectId)
      .reduce((sum, e) => sum + e.amount, 0),
}))
