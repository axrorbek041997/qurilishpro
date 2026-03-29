import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { StatCard } from '../components/Card'
import { useAppStore } from '../store/useAppStore'
import { useProjectsStore } from '../store/useProjectsStore'
import { useExpensesStore } from '../store/useExpensesStore'
import { useWorkersStore } from '../store/useWorkersStore'
import { useMaterialsStore } from '../store/useMaterialsStore'
import { AddExpenseModal } from '../features/expenses/AddExpenseModal'
import { AddTransactionModal } from '../features/materials/AddTransactionModal'
import { EXPENSE_CATEGORIES } from '../types'
import clsx from 'clsx'

const today = format(new Date(), 'yyyy-MM-dd')

export const Dashboard: React.FC = () => {
  const { t } = useTranslation()
  const { darkMode, toggleDarkMode } = useAppStore()
  const { getActiveProject } = useProjectsStore()
  const { getTotalForDate, getExpensesForDate, fetchExpenses } = useExpensesStore()
  const { getWorkersForProject, getAttendanceForDate, isPresent, fetchWorkers, fetchAttendance } = useWorkersStore()
  const { getStockForProject, fetchMaterials, fetchTransactions } = useMaterialsStore()

  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [addMaterialOpen, setAddMaterialOpen] = useState(false)

  const project = getActiveProject()
  const projectId = project?.id ?? ''

  useEffect(() => {
    if (!projectId) return
    fetchWorkers(projectId).catch(() => {})
    fetchAttendance(today, projectId).catch(() => {})
    fetchExpenses(projectId, today, today).catch(() => {})
    fetchMaterials(projectId).catch(() => {})
    fetchTransactions(projectId).catch(() => {})
  }, [projectId, fetchWorkers, fetchAttendance, fetchExpenses, fetchMaterials, fetchTransactions])

  const workers        = getWorkersForProject(projectId)
  const todayTotal     = getTotalForDate(today, projectId)
  const todayExpenses  = getExpensesForDate(today, projectId)
  const todayAttendance= getAttendanceForDate(today, projectId)
  const presentCount   = todayAttendance.filter((a) => a.present).length
  const totalWages     = workers.filter((w) => isPresent(w.id, today)).reduce((s, w) => s + w.dailyWage, 0)
  const stockList      = getStockForProject(projectId)
  const lowStockCount  = stockList.filter((s) => s.isLow).length

  const dateStr = format(new Date(), 'EEEE, d MMMM yyyy')

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
        <span className="text-5xl">🏗️</span>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('dashboard.noActiveProject')}</h2>
        <p className="text-sm text-slate-500 text-center">{t('dashboard.noActiveProjectDesc')}</p>
        <Link
          to="/projects"
          className="px-6 py-3 bg-primary-500 text-white rounded-2xl font-semibold hover:bg-primary-600 transition-colors"
        >
          {t('dashboard.goToProjects')}
        </Link>
      </div>
    )
  }

  return (
    <div className="pb-6">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 px-5 pt-12 pb-8 md:pt-8 md:mx-6 md:mt-6 md:rounded-3xl text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary-100 text-sm font-medium">{dateStr}</p>
            <h1 className="text-2xl md:text-3xl font-bold mt-0.5">{project.name}</h1>
            <p className="text-primary-200 text-sm mt-0.5">📍 {project.location}</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="md:hidden p-2.5 rounded-2xl bg-white/20 hover:bg-white/30 transition-colors"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="bg-white/15 rounded-2xl px-4 py-2 inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm font-semibold">{t('dashboard.activeProject')}</span>
          </div>
          <div className="bg-white/15 rounded-2xl px-4 py-2 inline-flex items-center gap-2">
            <span className="text-sm font-semibold">{t('dashboard.workersIn', { present: presentCount, total: workers.length })}</span>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 mt-4 md:-mt-2 space-y-4">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title={t('dashboard.todaysExpenses')} value={new Intl.NumberFormat('uz-UZ').format(todayTotal)} subtitle={t('dashboard.transactions', { count: todayExpenses.length })} icon="💰" color="bg-orange-100 text-orange-600" />
          <StatCard title={t('dashboard.workersPresent')}  value={`${presentCount} / ${workers.length}`} subtitle={t('dashboard.today')} icon="👷" color="bg-emerald-100 text-emerald-600" />
          <StatCard title={t('dashboard.dailyWages')}      value={new Intl.NumberFormat('uz-UZ').format(totalWages)} subtitle={t('common.uzsShort')} icon="💵" color="bg-blue-100 text-blue-600" />
          <StatCard title={t('dashboard.lowStockItems')}  value={lowStockCount} subtitle={lowStockCount > 0 ? t('dashboard.needsAttention') : t('dashboard.allGood')} icon={lowStockCount > 0 ? '⚠️' : '✅'} color={lowStockCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'} />
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card p-4">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">{t('dashboard.quickActions')}</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <ActionTile emoji="💸" label={t('dashboard.addExpense')}  color="bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100" textColor="text-orange-700 dark:text-orange-400" onClick={() => setAddExpenseOpen(true)} />
            <ActionTile emoji="🧱" label={t('dashboard.addMaterial')} color="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100"   textColor="text-blue-700 dark:text-blue-400"   onClick={() => setAddMaterialOpen(true)} />
            <ActionTile emoji="📷" label={t('dashboard.takePhoto')}   color="bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100" textColor="text-purple-700 dark:text-purple-400" onClick={() => {}} />
            <ActionTile emoji="👷" label={t('dashboard.attendance')}   color="bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100" textColor="text-emerald-700 dark:text-emerald-400" onClick={() => { window.location.href = '/workers' }} />
            <ActionTile emoji="📊" label={t('nav.reports')}      color="bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100"  textColor="text-slate-700 dark:text-slate-300"   onClick={() => { window.location.href = '/reports' }} />
            <ActionTile emoji="🏗️" label={t('nav.projects')}    color="bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100"    textColor="text-cyan-700 dark:text-cyan-400"     onClick={() => { window.location.href = '/projects' }} />
          </div>
        </div>

        {/* Desktop two-col */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Expenses breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-800 dark:text-white">{t('dashboard.todaysExpensesList')}</p>
              <span className="text-xs text-slate-400">{t('dashboard.items', { count: todayExpenses.length })}</span>
            </div>
            {todayExpenses.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-2xl mb-1">💸</p>
                <p className="text-sm text-slate-400">{t('dashboard.noExpensesToday')}</p>
                <button onClick={() => setAddExpenseOpen(true)} className="mt-3 text-xs font-semibold text-primary-500 hover:text-primary-600">{t('dashboard.addOne')}</button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayExpenses.map((expense) => {
                  const cat = EXPENSE_CATEGORIES[expense.category]
                  return (
                    <div key={expense.id} className="flex items-center gap-3">
                      <span className="text-xl flex-shrink-0">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{expense.note || t(`expenses.categories.${expense.category}`)}</p>
                        <p className="text-xs text-slate-500">{t(`expenses.categories.${expense.category}`)}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {new Intl.NumberFormat('uz-UZ').format(expense.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Attendance + alerts */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-800 dark:text-white">{t('dashboard.todaysAttendance')}</p>
                <span className="text-xs text-slate-400">{t('dashboard.presentCount', { count: presentCount })}</span>
              </div>
              <div className="space-y-2">
                {workers.slice(0, 6).map((w) => {
                  const present = isPresent(w.id, today)
                  return (
                    <div key={w.id} className="flex items-center gap-2.5">
                      <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0', present ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-400')}>
                        {w.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{w.name}</p>
                        <p className="text-xs text-slate-400">{w.role}</p>
                      </div>
                      <span className={clsx('text-xs font-bold', present ? 'text-emerald-600' : 'text-red-500')}>
                        {present ? t('workers.present') : t('workers.absent')}
                      </span>
                    </div>
                  )
                })}
                {workers.length > 6 && <p className="text-xs text-slate-400 text-center pt-1">{t('dashboard.moreWorkers', { count: workers.length - 6 })}</p>}
              </div>
            </div>

            {lowStockCount > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
                <p className="font-bold text-amber-800 dark:text-amber-400 text-sm mb-2">⚠️ {t('dashboard.lowStockAlert')}</p>
                <div className="space-y-1.5">
                  {stockList.filter((s) => s.isLow).map(({ material, stock }) => (
                    <div key={material.id} className="flex justify-between">
                      <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">{material.name}</span>
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-400">{stock} {material.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddExpenseModal open={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} />
      <AddTransactionModal open={addMaterialOpen} onClose={() => setAddMaterialOpen(false)} />
    </div>
  )
}

interface ActionTileProps { emoji: string; label: string; color: string; textColor: string; onClick: () => void }
const ActionTile: React.FC<ActionTileProps> = ({ emoji, label, color, textColor, onClick }) => (
  <button onClick={onClick} className={clsx('flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95', color)}>
    <span className="text-2xl">{emoji}</span>
    <span className={clsx('text-xs font-bold text-center leading-tight', textColor)}>{label}</span>
  </button>
)
