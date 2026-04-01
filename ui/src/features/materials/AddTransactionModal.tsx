import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input, Select, Textarea } from '../../components/Input'
import { useMaterialsStore } from '../../store/useMaterialsStore'
import { useProjectsStore } from '../../store/useProjectsStore'
import { MaterialTransactionType } from '../../types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Props { open: boolean; onClose: () => void; preselectedMaterialId?: string }

export const AddTransactionModal: React.FC<Props> = ({ open, onClose, preselectedMaterialId }) => {
  const { t } = useTranslation()
  const { getMaterialsForProject, addTransaction } = useMaterialsStore()
  const { getActiveProject } = useProjectsStore()
  const projectId = getActiveProject()?.id ?? ''
  const materials = getMaterialsForProject(projectId)

  const [materialId, setMaterialId] = useState(preselectedMaterialId ?? materials[0]?.id ?? '')
  const [type, setType] = useState<MaterialTransactionType>('in')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const selectedMaterial = materials.find((m) => m.id === materialId)

  // Sync materialId when materials load after modal mounts
  useEffect(() => {
    if (!materialId && materials.length > 0) {
      setMaterialId(preselectedMaterialId ?? materials[0].id)
    }
  }, [materials])

  const handleSubmit = async () => {
    const qty = parseFloat(quantity.replace(',', '.'))
    if (!quantity.trim() || isNaN(qty) || qty <= 0) { setError(t('common.required')); return }
    if (!materialId) { toast.error(t('materials.form.noMaterialsForProject')); return }
    try {
      await addTransaction({ materialId, type, quantity: qty, note: note.trim() || undefined, date: format(new Date(), 'yyyy-MM-dd'), projectId })
      toast.success(type === 'in' ? t('materials.stockAdded') : t('materials.stockRemoved'))
      handleClose()
    } catch {
      toast.error('Failed to record transaction')
    }
  }

  const handleClose = () => {
    setQuantity(''); setNote(''); setType('in'); setError(''); onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={t('materials.form.recordTitle')}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setType('in')} className={clsx('flex items-center justify-center gap-2 p-4 rounded-2xl border-2 font-bold text-base transition-all', type === 'in' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-500')}>
            <span className="text-xl">📥</span> {t('materials.form.recordIn').toUpperCase()}
          </button>
          <button onClick={() => setType('out')} className={clsx('flex items-center justify-center gap-2 p-4 rounded-2xl border-2 font-bold text-base transition-all', type === 'out' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'border-slate-200 dark:border-slate-700 text-slate-500')}>
            <span className="text-xl">📤</span> {t('materials.form.recordOut').toUpperCase()}
          </button>
        </div>
        {materials.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">{t('materials.form.noMaterialsForProject')}</p>
        ) : (
          <Select label={t('materials.form.selectMaterial')} value={materialId} onChange={(e) => setMaterialId(e.target.value)} options={materials.map((m) => ({ value: m.id, label: `${m.name} (${m.unit})` }))} />
        )}
        <Input label={`${t('materials.form.quantity')}${selectedMaterial ? ` (${selectedMaterial.unit})` : ''}`} placeholder="e.g. 50" value={quantity} onChange={(e) => { setQuantity(e.target.value); setError('') }} error={error} inputMode="decimal" />
        <Textarea label={t('materials.form.note')} placeholder={t('materials.form.notePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={handleClose}>{t('common.cancel')}</Button>
          <Button fullWidth size="lg" variant={type === 'in' ? 'success' : 'danger'} onClick={handleSubmit}>
            {type === 'in' ? t('materials.form.recordIn') : t('materials.form.recordOut')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
