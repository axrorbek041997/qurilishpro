import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { Input } from '../components/Input'
import { useMaterialsStore } from '../store/useMaterialsStore'
import { useProjectsStore } from '../store/useProjectsStore'
import { AddTransactionModal } from '../features/materials/AddTransactionModal'
import clsx from 'clsx'
import toast from 'react-hot-toast'

export const Materials: React.FC = () => {
  const { t } = useTranslation()
  const {
    getStockForProject, getMaterialsForProject, addMaterial,
    getTransactionsForMaterial, fetchMaterials, fetchTransactions,
  } = useMaterialsStore()
  const { getActiveProject } = useProjectsStore()
  const projectId = getActiveProject()?.id ?? ''

  const [addTxOpen, setAddTxOpen] = useState(false)
  const [preselectedId, setPreselectedId] = useState<string | undefined>()
  const [addMatOpen, setAddMatOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [matName, setMatName] = useState('')
  const [matUnit, setMatUnit] = useState('')
  const [matMinStock, setMatMinStock] = useState('')
  const [matErrors, setMatErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!projectId) return
    fetchMaterials(projectId).catch(() => toast.error('Failed to load materials'))
    fetchTransactions(projectId).catch(() => {})
  }, [projectId, fetchMaterials, fetchTransactions])

  const stockList = getStockForProject(projectId)
  const lowCount = stockList.filter((s) => s.isLow).length

  const handleAddMaterial = async () => {
    const e: Record<string, string> = {}
    if (!matName.trim()) e.name = t('common.required')
    if (!matUnit.trim()) e.unit = t('common.required')
    if (Object.keys(e).length > 0) { setMatErrors(e); return }
    setSubmitting(true)
    try {
      await addMaterial({ name: matName.trim(), unit: matUnit.trim(), minStock: matMinStock ? Number(matMinStock) : undefined, projectId })
      toast.success(t('materials.materialAdded'))
      setMatName(''); setMatUnit(''); setMatMinStock(''); setMatErrors({}); setAddMatOpen(false)
    } catch {
      toast.error('Failed to add material')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pb-24 md:pb-6">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 pt-14 md:pt-6 pb-4 sticky top-0 z-30">
        <PageHeader
          title={t('materials.title')}
          subtitle={lowCount > 0 ? t('materials.lowStockItems', { count: lowCount }) : t('materials.allStockOk')}
          action={<div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => setAddMatOpen(true)}>{t('materials.addMaterial')}</Button><Button size="sm" onClick={() => { setPreselectedId(undefined); setAddTxOpen(true) }}>{t('materials.record')}</Button></div>}
        />
      </div>

      <div className="px-4 md:px-6 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {stockList.length === 0 ? (
          <div className="col-span-full">
            <EmptyState icon="🧱" title={t('materials.noMaterials')} description={t('materials.noMaterialsDesc')} action={{ label: t('materials.addMaterial'), onClick: () => setAddMatOpen(true) }} />
          </div>
        ) : (
          stockList.map(({ material, stock, inTotal, outTotal, isLow }) => {
            const pct = material.minStock ? Math.min((stock / (material.minStock * 2)) * 100, 100) : null
            const isExpanded = expandedId === material.id
            const txHistory = getTransactionsForMaterial(material.id).slice(0, 5)

            return (
              <div key={material.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-card overflow-hidden">
                <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : material.id)}>
                  <div className="flex items-start gap-3">
                    <div className={clsx('w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0', isLow ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500')}>
                      {material.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{material.name}</p>
                        {isLow && <Badge variant="red" size="sm">{t('materials.low')}</Badge>}
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{stock.toLocaleString()}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{material.unit}</span>
                      </div>
                      {pct !== null && (
                        <div className="mt-1.5">
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={clsx('h-full rounded-full transition-all', isLow ? 'bg-red-400' : 'bg-emerald-400')} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>Min: {material.minStock} {material.unit}</span>
                            <span>↑{inTotal} ↓{outTotal}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-1.5 text-center"><p className="text-xs text-emerald-600">{t('materials.stockIn').toUpperCase()}</p><p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">{inTotal}</p></div>
                    <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-1.5 text-center"><p className="text-xs text-red-600">{t('materials.stockUsed').toUpperCase()}</p><p className="font-bold text-red-700 dark:text-red-300 text-sm">{outTotal}</p></div>
                    <button onClick={(e) => { e.stopPropagation(); setPreselectedId(material.id); setAddTxOpen(true) }} className="flex-1 bg-primary-50 dark:bg-primary-900/20 rounded-xl px-3 py-1.5 text-center hover:bg-primary-100 transition-colors">
                      <p className="text-xs text-primary-600">{t('materials.record')}</p><p className="font-bold text-primary-700 dark:text-primary-300 text-sm">+/−</p>
                    </button>
                  </div>
                </div>
                {isExpanded && txHistory.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-700 px-4 pb-4 pt-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('materials.recent')}</p>
                    <div className="space-y-2">
                      {txHistory.map((tx) => (
                        <div key={tx.id} className="flex items-center gap-2.5">
                          <span className={clsx('w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0', tx.type === 'in' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>{tx.type === 'in' ? '↑' : '↓'}</span>
                          <div className="flex-1 min-w-0"><p className="text-xs text-slate-600 dark:text-slate-300 truncate">{tx.note || (tx.type === 'in' ? t('materials.stockIn') : t('materials.stockUsed'))}</p><p className="text-xs text-slate-400">{tx.date}</p></div>
                          <span className={clsx('text-sm font-bold', tx.type === 'in' ? 'text-emerald-600' : 'text-red-500')}>{tx.type === 'in' ? '+' : '−'}{tx.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <button onClick={() => { setPreselectedId(undefined); setAddTxOpen(true) }} className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl shadow-lg flex items-center justify-center text-2xl transition-all active:scale-95 z-40">+</button>

      <AddTransactionModal open={addTxOpen} onClose={() => { setAddTxOpen(false); setPreselectedId(undefined) }} preselectedMaterialId={preselectedId} />

      <Modal open={addMatOpen} onClose={() => setAddMatOpen(false)} title={t('materials.form.addMaterialTitle')}>
        <div className="space-y-4">
          <Input label={t('materials.form.materialName')} placeholder={t('materials.form.materialNamePlaceholder')} value={matName} onChange={(e) => { setMatName(e.target.value); setMatErrors((p) => ({ ...p, name: '' })) }} error={matErrors.name} />
          <Input label={t('materials.form.unit')} placeholder={t('materials.form.unitPlaceholder')} value={matUnit} onChange={(e) => { setMatUnit(e.target.value); setMatErrors((p) => ({ ...p, unit: '' })) }} error={matErrors.unit} />
          <Input label={t('materials.form.minStockAlert')} placeholder="e.g. 50" value={matMinStock} onChange={(e) => setMatMinStock(e.target.value)} inputMode="numeric" type="number" min="0" />
          <div className="flex gap-3 pt-1"><Button variant="secondary" fullWidth onClick={() => setAddMatOpen(false)}>{t('common.cancel')}</Button><Button fullWidth size="lg" loading={submitting} onClick={handleAddMaterial}>{t('common.add')}</Button></div>
        </div>
      </Modal>
    </div>
  )
}
