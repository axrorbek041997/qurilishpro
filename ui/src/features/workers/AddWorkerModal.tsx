import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { useWorkersStore } from '../../store/useWorkersStore'
import { useProjectsStore } from '../../store/useProjectsStore'
import toast from 'react-hot-toast'

interface Props { open: boolean; onClose: () => void }

const ROLE_KEYS = ['bricklayer','carpenter','electrician','plumber','generalWorker','craneOperator','welder','painter','mason','architect','other'] as const
type RoleKey = typeof ROLE_KEYS[number]

// English labels stored in the DB (for backward compatibility and export)
const ROLE_EN_LABELS: Record<RoleKey, string> = {
  bricklayer:   'Bricklayer',
  carpenter:    'Carpenter',
  electrician:  'Electrician',
  plumber:      'Plumber',
  generalWorker:'General Worker',
  craneOperator:'Crane Operator',
  welder:       'Welder',
  painter:      'Painter',
  mason:        'Mason',
  architect:    'Architect',
  other:        'Other',
}

export const AddWorkerModal: React.FC<Props> = ({ open, onClose }) => {
  const { t } = useTranslation()
  const addWorker = useWorkersStore((s) => s.addWorker)
  const { getActiveProject } = useProjectsStore()
  const [name, setName] = useState('')
  const [roleKey, setRoleKey] = useState<RoleKey>('bricklayer')
  const [customRole, setCustomRole] = useState('')
  const [wage, setWage] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = t('workers.form.nameRequired')
    if (!Number(wage.replace(/\s/g, ''))) e.wage = t('workers.form.wageRequired')
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    const projectId = getActiveProject()?.id ?? ''
    const roleName = roleKey === 'other'
      ? (customRole.trim() || ROLE_EN_LABELS.other)
      : ROLE_EN_LABELS[roleKey]
    try {
      await addWorker({ name: name.trim(), role: roleName, dailyWage: Number(wage.replace(/\s/g, '')), phone: phone.trim() || undefined, projectId })
      toast.success(t('workers.workerAdded'))
      handleClose()
    } catch {
      toast.error('Failed to add worker')
    }
  }

  const handleClose = () => {
    setName(''); setRoleKey('bricklayer'); setCustomRole(''); setWage(''); setPhone(''); setErrors({}); onClose()
  }

  const fmt = (v: string) => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  return (
    <Modal open={open} onClose={handleClose} title={t('workers.form.title')}>
      <div className="space-y-4">
        <Input label={t('workers.form.fullName')} placeholder={t('workers.form.fullNamePlaceholder')} value={name} onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })) }} error={errors.name} />
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('workers.form.role')}</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_KEYS.map((key) => (
              <button key={key} onClick={() => setRoleKey(key)} className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${roleKey === key ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                {t(`workers.roles.${key}`)}
              </button>
            ))}
          </div>
          {roleKey === 'other' && <Input placeholder={t('workers.form.role') + '...'} value={customRole} onChange={(e) => setCustomRole(e.target.value)} className="mt-2" />}
        </div>
        <Input label={t('workers.form.dailyWage')} placeholder={t('workers.form.dailyWagePlaceholder')} value={wage} onChange={(e) => { setWage(fmt(e.target.value)); setErrors((p) => ({ ...p, wage: '' })) }} error={errors.wage} inputMode="numeric" />
        <Input label={t('workers.form.phone')} placeholder={t('workers.form.phonePlaceholder')} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={handleClose}>{t('common.cancel')}</Button>
          <Button fullWidth size="lg" onClick={handleSubmit}>{t('workers.addWorker')}</Button>
        </div>
      </div>
    </Modal>
  )
}
