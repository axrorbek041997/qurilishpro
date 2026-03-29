import React, { useState, useMemo, useEffect } from 'react'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { Card, StatCard } from '../components/Card'
import { useExpensesStore } from '../store/useExpensesStore'
import { useWorkersStore } from '../store/useWorkersStore'
import { useMaterialsStore } from '../store/useMaterialsStore'
import { useProjectsStore } from '../store/useProjectsStore'
import { exportToExcel } from '../services/exportService'
import { EXPENSE_CATEGORIES } from '../types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import clsx from 'clsx'
import toast from 'react-hot-toast'

type Preset = 'today' | 'week' | 'month' | 'custom'
const COLORS = ['#f97316','#3b82f6','#8b5cf6','#10b981','#ef4444','#06b6d4','#64748b']

export const Reports: React.FC = () => {
  const { t } = useTranslation()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [preset, setPreset] = useState<Preset>('week')
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [customTo, setCustomTo] = useState(today)
  const [exporting, setExporting] = useState(false)

  const { getActiveProject } = useProjectsStore()
  const project = getActiveProject()
  const projectId = project?.id ?? ''

  const { getExpensesForRange, fetchExpenses } = useExpensesStore()
  const { getWorkersForProject, attendance, fetchWorkers, fetchAttendance } = useWorkersStore()
  const { getMaterialsForProject, transactions, fetchMaterials, fetchTransactions } = useMaterialsStore()

  const dateRange = useMemo(() => {
    switch (preset) {
      case 'today': return { from: today, to: today }
      case 'week':  return { from: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), to: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd') }
      case 'month': return { from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: format(endOfMonth(new Date()), 'yyyy-MM-dd') }
      case 'custom': return { from: customFrom, to: customTo }
    }
  }, [preset, customFrom, customTo, today])

  useEffect(() => {
    if (!projectId) return
    fetchWorkers(projectId).catch(() => {})
    fetchExpenses(projectId, dateRange.from, dateRange.to).catch(() => toast.error('Failed to load expenses'))
    fetchAttendance(dateRange.from, projectId, dateRange.to).catch(() => {})
    fetchTransactions(projectId, dateRange.from, dateRange.to).catch(() => {})
    fetchMaterials(projectId).catch(() => {})
  }, [projectId, dateRange.from, dateRange.to, fetchWorkers, fetchExpenses, fetchAttendance, fetchTransactions, fetchMaterials])

  const workers   = getWorkersForProject(projectId)
  const materials = getMaterialsForProject(projectId)

  const expenses = getExpensesForRange(dateRange.from, dateRange.to, projectId)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  const workerIds = new Set(workers.map((w) => w.id))
  const rangeAttendance = attendance.filter((a) => a.date >= dateRange.from && a.date <= dateRange.to && workerIds.has(a.workerId))
  const rangeTransactions = transactions.filter((tx) => tx.projectId === projectId && tx.date >= dateRange.from && tx.date <= dateRange.to)

  const totalWages = workers.reduce((sum, w) => {
    const days = rangeAttendance.filter((a) => a.workerId === w.id && a.present).length
    return sum + w.dailyWage * days
  }, 0)
  const totalDaysPresent = rangeAttendance.filter((a) => a.present).length

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach((e) => { const label = t(`expenses.categories.${e.category}`); map[label] = (map[label] ?? 0) + e.amount })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [expenses, t])

  const dailyExpenses = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach((e) => { map[e.date] = (map[e.date] ?? 0) + e.amount })
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b)).slice(-14)
      .map(([date, amount]) => ({ date: format(new Date(date), 'dd/MM'), amount: Math.round(amount / 1000) }))
  }, [expenses])

  const attendanceSummary = workers.map((w) => {
    const present = rangeAttendance.filter((a) => a.workerId === w.id && a.present).length
    return { ...w, present, earned: w.dailyWage * present }
  })

  const handleExport = () => {
    setExporting(true)
    try {
      exportToExcel({ expenses, workers, attendance: rangeAttendance, transactions: rangeTransactions, materials, dateRange, projectName: project?.name ?? 'Project' })
      toast.success(t('reports.exported'))
    } catch { toast.error(t('reports.exportFailed')) }
    finally { setExporting(false) }
  }

  const presets: { key: Preset; label: string }[] = [
    { key: 'today', label: t('reports.today') }, { key: 'week', label: t('reports.thisWeek') },
    { key: 'month', label: t('reports.thisMonth') }, { key: 'custom', label: t('reports.custom') },
  ]

  return (
    <div className="pb-24 md:pb-6">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 pt-14 md:pt-6 pb-4 sticky top-0 z-30">
        <PageHeader title={t('reports.title')} subtitle={project?.name} action={<Button onClick={handleExport} loading={exporting} icon={<span>📊</span>} variant="success" size="sm">{t('reports.exportExcel')}</Button>} />
        <div className="flex gap-2 mb-2">
          {presets.map((p) => (
            <button key={p.key} onClick={() => setPreset(p.key)} className={clsx('flex-1 py-2 rounded-xl text-xs font-semibold transition-colors', preset === p.key ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600')}>{p.label}</button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-slate-500 mb-1 block">{t('reports.from')}</label><input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-full text-sm bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-primary-400" /></div>
            <div><label className="text-xs text-slate-500 mb-1 block">{t('reports.to')}</label><input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-full text-sm bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-primary-400" /></div>
          </div>
        )}
      </div>

      <div className="px-4 md:px-6 pt-4 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title={t('reports.totalExpenses')} value={new Intl.NumberFormat('uz-UZ').format(totalExpenses)} subtitle={t('common.uzsShort')} icon="💰" color="bg-orange-100 text-orange-600" />
          <StatCard title={t('reports.totalWages')}    value={new Intl.NumberFormat('uz-UZ').format(totalWages)} subtitle={t('common.uzsShort')} icon="👷" color="bg-blue-100 text-blue-600" />
          <StatCard title={t('reports.transactions')}   value={expenses.length} subtitle={t('reports.expenseEntries')} icon="📝" color="bg-purple-100 text-purple-600" />
          <StatCard title={t('reports.workerDays')}    value={totalDaysPresent} subtitle={t('reports.attendanceRecords')} icon="📅" color="bg-emerald-100 text-emerald-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {dailyExpenses.length > 1 && (
            <Card>
              <p className="text-sm font-bold text-slate-800 dark:text-white mb-3">{t('reports.dailyExpensesChart')}</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dailyExpenses} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip formatter={(v: number) => [`${v}k ${t('common.uzsShort')}`, t('reports.totalExpenses')]} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 12 }} />
                  <Bar dataKey="amount" fill="#f97316" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
          {byCategory.length > 0 && (
            <Card>
              <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">{t('reports.byCategory')}</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [new Intl.NumberFormat('uz-UZ').format(v) + ' ' + t('common.uzsShort'), '']} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card padding="none" className="xl:col-span-2">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800 dark:text-white">{t('reports.workerAttendance')}</p>
              <span className="text-xs text-slate-400">{t('reports.workers', { count: attendanceSummary.length })}</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {attendanceSummary.map((w) => (
                <div key={w.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">{w.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{w.name}</p><p className="text-xs text-slate-500">{w.role}</p></div>
                  <div className="text-right"><p className="text-sm font-bold text-slate-900 dark:text-white">{w.present}d</p><p className="text-xs text-slate-400">{new Intl.NumberFormat('uz-UZ').format(w.earned)}</p></div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="xl:col-span-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">📊</div>
                <div><p className="font-bold text-slate-900 dark:text-white">{t('reports.excelExport')}</p><p className="text-xs text-slate-500">{t('reports.allDataInOne')}</p></div>
              </div>
              <ul className="space-y-1.5 mb-5">
                {(['expenses', 'workers', 'materials', 'transactions'] as const).map((key) => (
                  <li key={key} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="w-4 h-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center text-xs">✓</span>{t(`reports.sheets.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
            <Button fullWidth size="lg" variant="success" onClick={handleExport} loading={exporting} icon={<span>⬇️</span>}>{t('reports.downloadReport')}</Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
