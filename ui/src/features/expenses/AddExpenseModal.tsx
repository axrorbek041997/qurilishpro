import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input, Textarea } from '../../components/Input'
import { useExpensesStore } from '../../store/useExpensesStore'
import { useProjectsStore } from '../../store/useProjectsStore'
import { useMaterialsStore } from '../../store/useMaterialsStore'
import { useWorkersStore } from '../../store/useWorkersStore'
import { ExpenseCategory, EXPENSE_CATEGORIES } from '../../types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Props { open: boolean; onClose: () => void }

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000]

export const AddExpenseModal: React.FC<Props> = ({ open, onClose }) => {
  const { t } = useTranslation()
  const addExpense = useExpensesStore((s) => s.addExpense)
  const { getActiveProject } = useProjectsStore()
  const getMaterialsForProject = useMaterialsStore((s) => s.getMaterialsForProject)

  const getWorkersForProject = useWorkersStore((s) => s.getWorkersForProject)

  const projectId = getActiveProject()?.id ?? ''
  const materials = getMaterialsForProject(projectId)
  const workers = getWorkersForProject(projectId)

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('materials')
  const [note, setNote] = useState('')
  const [selectedMaterialId, setSelectedMaterialId] = useState('')
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [workerSearch, setWorkerSearch] = useState('')
  const [workerDropdownOpen, setWorkerDropdownOpen] = useState(false)
  const [error, setError] = useState('')
  const workerSearchRef = useRef<HTMLDivElement>(null)

  const filteredWorkers = workers.filter((w) =>
    w.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
    w.role.toLowerCase().includes(workerSearch.toLowerCase())
  )

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (workerSearchRef.current && !workerSearchRef.current.contains(e.target as Node)) {
        setWorkerDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCategoryChange = (key: ExpenseCategory) => {
    setCategory(key)
    setSelectedMaterialId('')
    setSelectedWorkerId('')
    setWorkerSearch('')
    setWorkerDropdownOpen(false)
  }

  const handleMaterialSelect = (id: string) => {
    const mat = materials.find((m) => m.id === id)
    setSelectedMaterialId(id)
    if (mat) setNote(mat.name)
  }

  const handleWorkerSelect = (id: string) => {
    const worker = workers.find((w) => w.id === id)
    setSelectedWorkerId(id)
    setWorkerSearch('')
    setWorkerDropdownOpen(false)
    if (worker) setNote(worker.name)
  }

  const handleSubmit = async () => {
    const amt = Number(amount.replace(/\s/g, ''))
    if (!amt || amt <= 0) { setError(t('common.required')); return }
    try {
      await addExpense({ amount: amt, category, note: note.trim() || undefined, date: format(new Date(), 'yyyy-MM-dd'), projectId })
      toast.success(t('expenses.expenseAdded'))
      handleClose()
    } catch {
      toast.error('Failed to add expense')
    }
  }

  const handleClose = () => {
    setAmount(''); setNote(''); setCategory('materials')
    setSelectedMaterialId(''); setSelectedWorkerId(''); setWorkerSearch('')
    setWorkerDropdownOpen(false); setError('')
    onClose()
  }

  const fmt = (val: string) => val.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  return (
    <Modal open={open} onClose={handleClose} title={t('expenses.form.title')}>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{t('expenses.form.category')}</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {(Object.entries(EXPENSE_CATEGORIES) as [ExpenseCategory, typeof EXPENSE_CATEGORIES[ExpenseCategory]][]).map(([key, val]) => (
              <button key={key} onClick={() => handleCategoryChange(key)} className={clsx('flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 transition-all text-xs font-semibold gap-1', category === key ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400')}>
                <span className="text-lg">{val.icon}</span>{t(`expenses.categories.${key}`)}
              </button>
            ))}
          </div>
        </div>

        {category === 'labor' && workers.length > 0 && (
          <div ref={workerSearchRef}>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('expenses.form.selectWorker')}</p>
            <div className="relative">
              <div
                className={clsx(
                  'w-full flex items-center gap-2 px-4 py-3 rounded-2xl border bg-white dark:bg-slate-800 cursor-text',
                  workerDropdownOpen ? 'border-primary-400 ring-2 ring-primary-400' : 'border-slate-200 dark:border-slate-700',
                )}
                onClick={() => setWorkerDropdownOpen(true)}
              >
                {selectedWorker && !workerDropdownOpen ? (
                  <>
                    <span className="flex-1 text-sm text-slate-900 dark:text-white font-medium truncate">{selectedWorker.name}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{selectedWorker.role}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedWorkerId(''); setNote('') }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                      autoFocus={workerDropdownOpen}
                      className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                      placeholder={t('common.search')}
                      value={workerSearch}
                      onChange={(e) => { setWorkerSearch(e.target.value); setWorkerDropdownOpen(true) }}
                      onFocus={() => setWorkerDropdownOpen(true)}
                    />
                  </>
                )}
              </div>

              {workerDropdownOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                  {filteredWorkers.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-slate-400 text-center">{t('common.search')}…</li>
                  ) : (
                    filteredWorkers.map((w) => (
                      <li
                        key={w.id}
                        onMouseDown={() => handleWorkerSelect(w.id)}
                        className={clsx(
                          'flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors',
                          selectedWorkerId === w.id
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold'
                            : 'text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700',
                        )}
                      >
                        <span>{w.name}</span>
                        <span className="text-xs text-slate-400">{w.role}</span>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
        )}

        {category === 'materials' && materials.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('expenses.form.selectMaterial')}</p>
            <div className="flex flex-wrap gap-2">
              {materials.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleMaterialSelect(m.id)}
                  className={clsx(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                    selectedMaterialId === m.id
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-600',
                  )}
                >
                  {m.name} <span className="opacity-60">({m.unit})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Input label={t('expenses.form.amount')} placeholder={t('expenses.form.amountPlaceholder')} value={amount} onChange={(e) => { setAmount(fmt(e.target.value)); setError('') }} error={error} inputMode="numeric" />
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((q) => (
            <button key={q} onClick={() => setAmount(fmt(String(q)))} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors">
              {new Intl.NumberFormat('uz-UZ').format(q)}
            </button>
          ))}
        </div>
        <Textarea label={t('expenses.form.note')} placeholder={t('expenses.form.notePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center cursor-pointer hover:border-primary-400 transition-colors">
          <p className="text-2xl mb-1">📷</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('expenses.form.attachPhoto')}</p>
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={handleClose}>{t('common.cancel')}</Button>
          <Button fullWidth onClick={handleSubmit} size="lg">{t('expenses.addExpense')}</Button>
        </div>
      </div>
    </Modal>
  )
}
