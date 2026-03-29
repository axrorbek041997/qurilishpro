import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import { useWorkersStore } from '../store/useWorkersStore'
import { useProjectsStore } from '../store/useProjectsStore'
import { AddWorkerModal } from '../features/workers/AddWorkerModal'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const today = format(new Date(), 'yyyy-MM-dd')

const ROLE_COLORS: Record<string, string> = {
  Bricklayer:     'bg-orange-100 text-orange-700',
  Carpenter:      'bg-amber-100 text-amber-700',
  Electrician:    'bg-yellow-100 text-yellow-700',
  Plumber:        'bg-blue-100 text-blue-700',
  'General Worker':'bg-slate-100 text-slate-700',
  'Crane Operator':'bg-purple-100 text-purple-700',
  Welder:         'bg-red-100 text-red-700',
  Painter:        'bg-pink-100 text-pink-700',
  Architect:      'bg-cyan-100 text-cyan-700',
}

const ROLE_KEY_MAP: Record<string, string> = {
  'Bricklayer':     'bricklayer',
  'Carpenter':      'carpenter',
  'Electrician':    'electrician',
  'Plumber':        'plumber',
  'General Worker': 'generalWorker',
  'Crane Operator': 'craneOperator',
  'Welder':         'welder',
  'Painter':        'painter',
  'Mason':          'mason',
  'Architect':      'architect',
  'Other':          'other',
}

export const Workers: React.FC = () => {
  const { t } = useTranslation()
  const {
    getWorkersForProject, isPresent, toggleAttendance,
    setAllPresent, setAllAbsent, removeWorker,
    fetchWorkers, fetchAttendance, isLoading,
  } = useWorkersStore()
  const { getActiveProject } = useProjectsStore()
  const project = getActiveProject()
  const projectId = project?.id ?? ''
  const workers = getWorkersForProject(projectId)

  const [addOpen, setAddOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    fetchWorkers(projectId).catch(() => toast.error('Failed to load workers'))
    fetchAttendance(today, projectId).catch(() => {})
  }, [projectId, fetchWorkers, fetchAttendance])

  const presentCount = workers.filter((w) => isPresent(w.id, today)).length
  const totalWages = workers.filter((w) => isPresent(w.id, today)).reduce((sum, w) => sum + w.dailyWage, 0)

  const handleRemove = async (id: string) => {
    try {
      await removeWorker(id)
      setConfirmDelete(null)
      toast.success(t('workers.workerRemoved'))
    } catch {
      toast.error('Failed to remove worker')
    }
  }

  const handleAllPresent = async () => {
    try {
      await setAllPresent(projectId, today)
      toast.success(t('workers.allMarkedPresent'))
    } catch {
      toast.error('Failed to update attendance')
    }
  }

  const handleAllAbsent = async () => {
    try {
      await setAllAbsent(projectId, today)
      toast.success(t('workers.allMarkedAbsent'))
    } catch {
      toast.error('Failed to update attendance')
    }
  }

  if (isLoading && workers.length === 0) {
    return (
      <div className="px-4 md:px-6 pt-14 md:pt-6 space-y-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    )
  }

  if (workers.length === 0) {
    return (
      <div>
        <div className="px-4 md:px-6 pt-14 md:pt-6 pb-4">
          <PageHeader title={t('workers.title')} subtitle={project?.name} action={<Button onClick={() => setAddOpen(true)} icon={<PlusIcon />}>{t('workers.addWorker')}</Button>} />
        </div>
        <EmptyState icon="👷" title={t('workers.noWorkers')} description={t('workers.noWorkersDesc')} action={{ label: t('workers.addWorker'), onClick: () => setAddOpen(true) }} />
        <AddWorkerModal open={addOpen} onClose={() => setAddOpen(false)} />
      </div>
    )
  }

  return (
    <div className="pb-6">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 pt-14 md:pt-6 pb-4 sticky top-0 z-30">
        <PageHeader
          title={t('workers.title')}
          subtitle={format(new Date(), 'EEEE, d MMMM')}
          action={<Button onClick={() => setAddOpen(true)} size="sm" icon={<PlusIcon />}>{t('workers.addWorker')}</Button>}
        />
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('workers.present')}</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{presentCount} / {workers.length}</p>
          </div>
          <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 rounded-xl px-3 py-2">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">{t('workers.dailyWages')}</p>
            <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{new Intl.NumberFormat('uz-UZ').format(totalWages)}</p>
          </div>
          <div className="flex flex-col gap-1">
            <button onClick={handleAllPresent} className="text-xs px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-semibold whitespace-nowrap hover:bg-emerald-200 transition-colors">{t('workers.allIn')}</button>
            <button onClick={handleAllAbsent}  className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl font-semibold whitespace-nowrap hover:bg-red-200 transition-colors">{t('workers.allOut')}</button>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {workers.map((worker) => {
          const present = isPresent(worker.id, today)
          const roleKey = ROLE_KEY_MAP[worker.role]
          const roleLabel = roleKey ? t(`workers.roles.${roleKey}`) : worker.role
          return (
            <div key={worker.id} className={clsx('bg-white dark:bg-slate-800 rounded-2xl shadow-card p-4 transition-all', present && 'ring-1 ring-emerald-300 dark:ring-emerald-700')}>
              <div className="flex items-center gap-3">
                <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0', present ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-400')}>
                  {worker.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{worker.name}</p>
                  <span className={clsx('inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5', ROLE_COLORS[worker.role] ?? 'bg-slate-100 text-slate-600')}>{roleLabel}</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{new Intl.NumberFormat('uz-UZ').format(worker.dailyWage)} {t('common.perDay')}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleAttendance(worker.id, today).catch(() => toast.error('Failed to update attendance'))}
                    className={clsx('relative w-14 h-7 rounded-full transition-all duration-200 focus:outline-none', present ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-600')}
                  >
                    <span className={clsx('absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200', present ? 'translate-x-7' : 'translate-x-0.5')} />
                  </button>
                  <span className={clsx('text-xs font-bold', present ? 'text-emerald-600' : 'text-red-500')}>{present ? t('workers.present') : t('workers.absent')}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <p className="text-xs text-slate-400">{worker.phone ?? t('common.noPhone')}</p>
                {confirmDelete === worker.id ? (
                  <div className="flex gap-1.5">
                    <button onClick={() => handleRemove(worker.id)} className="text-xs px-2.5 py-1 bg-red-500 text-white rounded-lg font-semibold">{t('common.delete')}</button>
                    <button onClick={() => setConfirmDelete(null)} className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 rounded-lg font-semibold">{t('common.cancel')}</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(worker.id)} className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium">{t('common.remove')}</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AddWorkerModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
