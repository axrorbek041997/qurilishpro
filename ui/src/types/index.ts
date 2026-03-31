export interface Worker {
  id: string
  name: string
  role: string
  dailyWage: number
  phone?: string
  projectId: string
}

export interface AttendanceRecord {
  id: string
  workerId: string
  date: string
  present: boolean
  overtimeHours?: number
}

export type ExpenseCategory =
  | 'materials'
  | 'labor'
  | 'equipment'
  | 'transport'
  | 'food'
  | 'utilities'
  | 'other'

export interface Expense {
  id: string
  amount: number
  category: ExpenseCategory
  note?: string
  date: string
  imageUrl?: string
  projectId: string
}

export type MaterialTransactionType = 'in' | 'out'

export interface Material {
  id: string
  name: string
  unit: string
  minStock?: number
  projectId: string
}

export interface MaterialTransaction {
  id: string
  materialId: string
  type: MaterialTransactionType
  quantity: number
  note?: string
  date: string
  projectId: string
}

export type SchemaFileType = 'dxf' | 'pdf' | 'image' | 'svg'

export interface ProjectSchema {
  id: string
  name: string
  fileType: SchemaFileType
  size: number         // bytes
  uploadedAt: string
  // content is stored separately in memory (not persisted) to avoid localStorage limits
}

export type ProjectStatus = 'active' | 'completed' | 'paused'

export interface Project {
  id: string
  name: string
  location: string
  startDate: string
  endDate?: string
  status: ProjectStatus
  description?: string
  budget?: number
  schemas: ProjectSchema[]
}

export interface DailyReport {
  date: string
  totalExpenses: number
  presentWorkers: number
  totalWorkers: number
  totalWages: number
}

export interface AppUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'viewer'
  createdAt: string
  updatedAt: string
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; color: string; icon: string }> = {
  materials: { label: 'Materials', color: 'bg-blue-100 text-blue-700', icon: '🧱' },
  labor:     { label: 'Labor',     color: 'bg-purple-100 text-purple-700', icon: '👷' },
  equipment: { label: 'Equipment', color: 'bg-yellow-100 text-yellow-700', icon: '🔧' },
  transport: { label: 'Transport', color: 'bg-green-100 text-green-700', icon: '🚚' },
  food:      { label: 'Food',      color: 'bg-red-100 text-red-700', icon: '🍱' },
  utilities: { label: 'Utilities', color: 'bg-cyan-100 text-cyan-700', icon: '💡' },
  other:     { label: 'Other',     color: 'bg-slate-100 text-slate-700', icon: '📦' },
}

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; color: string; dot: string }> = {
  active:    { label: 'Active',    color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  paused:    { label: 'Paused',    color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400'   },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-600',     dot: 'bg-slate-400'   },
}
