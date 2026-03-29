import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input, Select, Textarea } from '../../components/Input'
import { useProjectsStore } from '../../store/useProjectsStore'
import { Project, ProjectStatus } from '../../types'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
  editProject?: Project
}

export const ProjectFormModal: React.FC<Props> = ({ open, onClose, editProject }) => {
  const { t } = useTranslation()
  const { createProject, updateProject } = useProjectsStore()
  const isEdit = !!editProject

  const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
    { value: 'active',    label: `🟢 ${t('status.active')}` },
    { value: 'paused',    label: `🟡 ${t('status.paused')}` },
    { value: 'completed', label: `⚫ ${t('status.completed')}` },
  ]

  const [name,        setName]        = useState('')
  const [location,    setLocation]    = useState('')
  const [startDate,   setStartDate]   = useState('')
  const [endDate,     setEndDate]     = useState('')
  const [status,      setStatus]      = useState<ProjectStatus>('active')
  const [description, setDescription] = useState('')
  const [budget,      setBudget]      = useState('')
  const [errors,      setErrors]      = useState<Record<string, string>>({})

  useEffect(() => {
    if (editProject) {
      setName(editProject.name)
      setLocation(editProject.location)
      setStartDate(editProject.startDate)
      setEndDate(editProject.endDate ?? '')
      setStatus(editProject.status)
      setDescription(editProject.description ?? '')
      setBudget(editProject.budget ? String(editProject.budget) : '')
    } else {
      resetForm()
    }
  }, [editProject, open])

  const resetForm = () => {
    setName(''); setLocation(''); setStartDate('')
    setEndDate(''); setStatus('active'); setDescription('')
    setBudget(''); setErrors({})
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim())      e.name      = t('projects.form.nameRequired')
    if (!location.trim())  e.location  = t('projects.form.locationRequired')
    if (!startDate)        e.startDate = t('projects.form.startDateRequired')
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    const data = {
      name:        name.trim(),
      location:    location.trim(),
      startDate,
      endDate:     endDate || undefined,
      status,
      description: description.trim() || undefined,
      budget:      budget ? Number(budget.replace(/\s/g, '')) : undefined,
    }

    try {
      if (isEdit) {
        await updateProject(editProject!.id, data)
        toast.success(t('projects.form.projectUpdated'))
      } else {
        await createProject(data)
        toast.success(t('projects.form.projectCreated'))
      }
      handleClose()
    } catch {
      toast.error('Failed to save project')
    }
  }

  const handleClose = () => { resetForm(); onClose() }

  const formatBudget = (v: string) =>
    v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  return (
    <Modal open={open} onClose={handleClose} title={isEdit ? t('projects.form.editTitle') : t('projects.form.createTitle')}>
      <div className="space-y-4">
        <Input
          label={t('projects.form.projectName')}
          placeholder={t('projects.form.projectNamePlaceholder')}
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })) }}
          error={errors.name}
        />

        <Input
          label={t('projects.form.location')}
          placeholder={t('projects.form.locationPlaceholder')}
          value={location}
          onChange={(e) => { setLocation(e.target.value); setErrors((p) => ({ ...p, location: '' })) }}
          error={errors.location}
          icon={<span className="text-sm">📍</span>}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('projects.form.startDate')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setErrors((p) => ({ ...p, startDate: '' })) }}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
            {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t('projects.form.endDate')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
        </div>

        <Select
          label={t('projects.form.status')}
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          options={STATUS_OPTIONS}
        />

        <Input
          label={t('projects.form.budgetLabel')}
          placeholder={t('projects.form.budgetPlaceholder')}
          value={budget}
          onChange={(e) => setBudget(formatBudget(e.target.value))}
          inputMode="numeric"
          icon={<span className="text-sm">💰</span>}
        />

        <Textarea
          label={t('projects.form.description')}
          placeholder={t('projects.form.descriptionPlaceholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={handleClose}>{t('common.cancel')}</Button>
          <Button fullWidth size="lg" onClick={handleSubmit}>
            {isEdit ? t('projects.form.saveButton') : t('projects.form.createButton')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
