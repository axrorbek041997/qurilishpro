import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input, Select } from '../../components/Input'
import { useUsersStore } from '../../store/useUsersStore'
import { AppUser } from '../../types'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
  editUser?: AppUser | null
}

const ROLE_OPTIONS = ['admin', 'manager', 'viewer'] as const

export const UserFormModal: React.FC<Props> = ({ open, onClose, editUser }) => {
  const { t } = useTranslation()
  const { createUser, updateUser } = useUsersStore()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<string>('manager')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const isEdit = !!editUser

  useEffect(() => {
    if (editUser) {
      setEmail(editUser.email)
      setName(editUser.name)
      setRole(editUser.role)
      setPassword('')
    } else {
      setEmail(''); setName(''); setPassword(''); setRole('manager')
    }
    setErrors({})
  }, [editUser, open])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!email.trim()) e.email = t('users.form.emailRequired')
    if (!name.trim()) e.name = t('users.form.nameRequired')
    if (!isEdit && !password.trim()) e.password = t('users.form.passwordRequired')
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setLoading(true)
    try {
      if (isEdit) {
        const payload: Record<string, string> = { email, name, role }
        if (password.trim()) payload.password = password
        await updateUser(editUser!.id, payload)
        toast.success(t('users.userUpdated'))
      } else {
        await createUser({ email, name, password, role })
        toast.success(t('users.userAdded'))
      }
      onClose()
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? (isEdit ? 'Failed to update user' : 'Failed to add user')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t('users.form.editTitle') : t('users.form.createTitle')}>
      <div className="space-y-4">
        <Input
          label={t('users.form.name')}
          placeholder={t('users.form.namePlaceholder')}
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })) }}
          error={errors.name}
        />
        <Input
          label={t('users.form.email')}
          placeholder={t('users.form.emailPlaceholder')}
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })) }}
          error={errors.email}
        />
        <Input
          label={isEdit ? t('users.form.newPassword') : t('users.form.password')}
          placeholder={t('users.form.passwordPlaceholder')}
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })) }}
          error={errors.password}
        />
        <Select
          label={t('users.form.role')}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={ROLE_OPTIONS.map((r) => ({ value: r, label: t(`users.roles.${r}`) }))}
        />
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose}>{t('common.cancel')}</Button>
          <Button fullWidth size="lg" onClick={handleSubmit} disabled={loading}>
            {isEdit ? t('common.save') : t('users.addUser')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
