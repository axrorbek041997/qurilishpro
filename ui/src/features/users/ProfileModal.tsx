import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { useUsersStore } from '../../store/useUsersStore'
import { useAuthStore } from '../../store/useAuthStore'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
}

export const ProfileModal: React.FC<Props> = ({ open, onClose }) => {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const { updateProfile } = useUsersStore()

  const handleLogout = async () => {
    onClose()
    await logout()
    toast.success(t('auth.loggedOut'))
  }

  const [name, setName] = useState(user?.name ?? '')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = t('users.form.nameRequired')
    if (Object.keys(e).length > 0) { setErrors(e); return }

    const payload: { name?: string; password?: string } = {}
    if (name.trim() !== user?.name) payload.name = name.trim()
    if (password.trim()) payload.password = password.trim()

    if (Object.keys(payload).length === 0) { onClose(); return }

    setLoading(true)
    try {
      await updateProfile(payload)
      toast.success(t('users.profileUpdated'))
      setPassword('')
      onClose()
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setName(user?.name ?? '')
    setPassword('')
    setErrors({})
  }

  // Sync name when modal opens
  React.useEffect(() => {
    if (open) handleOpen()
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title={t('users.profile')}>
      <div className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
          {user?.email}
          <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[user?.role ?? 'viewer']}`}>
            {t(`users.roles.${user?.role}`)}
          </span>
        </div>
        <Input
          label={t('users.form.name')}
          placeholder={t('users.form.namePlaceholder')}
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })) }}
          error={errors.name}
        />
        <Input
          label={t('users.form.newPassword')}
          placeholder={t('users.form.passwordPlaceholder')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose}>{t('common.cancel')}</Button>
          <Button fullWidth size="lg" onClick={handleSubmit} disabled={loading}>{t('common.save')}</Button>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all mt-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          {t('auth.logout')}
        </button>
      </div>
    </Modal>
  )
}

const ROLE_COLORS: Record<string, string> = {
  admin:   'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewer:  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}
