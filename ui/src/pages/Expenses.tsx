import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { useExpensesStore } from '../store/useExpensesStore'
import { useProjectsStore } from '../store/useProjectsStore'
import { AddExpenseModal } from '../features/expenses/AddExpenseModal'
import { EXPENSE_CATEGORIES, ExpenseCategory } from '../types'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const today = format(new Date(), 'yyyy-MM-dd')

export const Expenses: React.FC = () => {
  const { t } = useTranslation()
  const { expenses, removeExpense, getTotalForDate, fetchExpenses } = useExpensesStore()
  const { getActiveProject } = useProjectsStore()
  const projectId = getActiveProject()?.id ?? ''

  const [addOpen, setAddOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    fetchExpenses(projectId, today, today).catch(() => toast.error('Failed to load expenses'))
  }, [projectId, fetchExpenses])

  const todayExpenses = expenses.filter((e) => e.date === today && e.projectId === projectId)
  const filtered = selectedCategory === 'all' ? todayExpenses : todayExpenses.filter((e) => e.category === selectedCategory)
  const total = getTotalForDate(today, projectId)

  const categoryTotals = (Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[])
    .map((cat) => ({ cat, amount: todayExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0), count: todayExpenses.filter((e) => e.category === cat).length }))
    .filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount)

  const handleDelete = async (id: string) => {
    try {
      await removeExpense(id)
      setConfirmDelete(null)
      toast.success(t('expenses.expenseRemoved'))
    } catch {
      toast.error('Failed to remove expense')
    }
  }

  return (
    <div className="pb-24 md:pb-6">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 pt-14 md:pt-6 pb-4 sticky top-0 z-30">
        <PageHeader title={t('expenses.title')} subtitle={format(new Date(), 'd MMMM yyyy')} action={<Button size="sm" icon={<PlusIcon />} onClick={() => setAddOpen(true)}>{t('expenses.addExpense')}</Button>} />
        <div className="bg-gradient-to-r from-orange-500 to-primary-500 rounded-2xl px-4 py-3 flex items-center justify-between mb-3">
          <div>
            <p className="text-orange-100 text-xs font-medium">{t('expenses.todaysTotal')}</p>
            <p className="text-white text-2xl font-bold">{new Intl.NumberFormat('uz-UZ').format(total)} <span className="text-base opacity-80">{t('common.uzsShort')}</span></p>
          </div>
          <span className="text-3xl">💰</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={selectedCategory === 'all'} onClick={() => setSelectedCategory('all')}>{t('common.all')} ({todayExpenses.length})</FilterChip>
          {(Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map((cat) => {
            const count = todayExpenses.filter((e) => e.category === cat).length
            if (count === 0) return null
            return <FilterChip key={cat} active={selectedCategory === cat} onClick={() => setSelectedCategory(cat)}>{EXPENSE_CATEGORIES[cat].icon} {t(`expenses.categories.${cat}`)} ({count})</FilterChip>
          })}
        </div>
      </div>

      <div className="px-4 md:px-6 pt-4 flex flex-col lg:flex-row gap-4 items-start">
        <div className="w-full lg:flex-1 space-y-3">
          {filtered.length === 0 ? (
            <EmptyState icon="💸" title={t('expenses.noExpenses')} description={t('expenses.noExpensesDesc')} action={{ label: t('expenses.addExpense'), onClick: () => setAddOpen(true) }} />
          ) : (
            filtered.map((expense) => {
              const cat = EXPENSE_CATEGORIES[expense.category]
              return (
                <div key={expense.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl flex-shrink-0">{cat.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{expense.note || t(`expenses.categories.${expense.category}`)}</p>
                          <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5', cat.color)}>{t(`expenses.categories.${expense.category}`)}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-slate-900 dark:text-white text-base">{new Intl.NumberFormat('uz-UZ').format(expense.amount)}</p>
                          <p className="text-xs text-slate-400">{t('common.uzsShort')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {confirmDelete === expense.id ? (
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleDelete(expense.id)} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold">{t('common.delete')}</button>
                      <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold">{t('common.cancel')}</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(expense.id)} className="mt-2 text-xs text-slate-400 hover:text-red-500 transition-colors font-medium">{t('common.remove')}</button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {categoryTotals.length > 0 && (
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card p-4 sticky top-44">
              <p className="text-sm font-bold text-slate-800 dark:text-white mb-3">{t('expenses.byCategory')}</p>
              <div className="space-y-3">
                {categoryTotals.map(({ cat, amount, count }) => {
                  const info = EXPENSE_CATEGORIES[cat]
                  const pct = total > 0 ? (amount / total) * 100 : 0
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span>{info.icon}</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t(`expenses.categories.${cat}`)}</span>
                          <span className="text-xs text-slate-400">×{count}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{new Intl.NumberFormat('uz-UZ').format(amount)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('expenses.total')}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{new Intl.NumberFormat('uz-UZ').format(total)} {t('common.uzsShort')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <button onClick={() => setAddOpen(true)} className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl shadow-lg flex items-center justify-center text-2xl transition-all active:scale-95 z-40">+</button>
      <AddExpenseModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

const FilterChip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} className={clsx('flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors', active ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600')}>
    {children}
  </button>
)

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
