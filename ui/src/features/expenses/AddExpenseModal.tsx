import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input, Textarea } from '../../components/Input'
import { useExpensesStore } from '../../store/useExpensesStore'
import { useProjectsStore } from '../../store/useProjectsStore'
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
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('materials')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const amt = Number(amount.replace(/\s/g, ''))
    if (!amt || amt <= 0) { setError(t('common.required')); return }
    const projectId = getActiveProject()?.id ?? ''
    try {
      await addExpense({ amount: amt, category, note: note.trim() || undefined, date: format(new Date(), 'yyyy-MM-dd'), projectId })
      toast.success(t('expenses.expenseAdded'))
      handleClose()
    } catch {
      toast.error('Failed to add expense')
    }
  }

  const handleClose = () => {
    setAmount(''); setNote(''); setCategory('materials'); setError(''); onClose()
  }

  const fmt = (val: string) => val.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  return (
    <Modal open={open} onClose={handleClose} title={t('expenses.form.title')}>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{t('expenses.form.category')}</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {(Object.entries(EXPENSE_CATEGORIES) as [ExpenseCategory, typeof EXPENSE_CATEGORIES[ExpenseCategory]][]).map(([key, val]) => (
              <button key={key} onClick={() => setCategory(key)} className={clsx('flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 transition-all text-xs font-semibold gap-1', category === key ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400')}>
                <span className="text-lg">{val.icon}</span>{t(`expenses.categories.${key}`)}
              </button>
            ))}
          </div>
        </div>
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
