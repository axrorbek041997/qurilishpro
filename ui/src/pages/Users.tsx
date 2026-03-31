import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import { useUsersStore } from '../store/useUsersStore'
import { useAuthStore } from '../store/useAuthStore'
import { UserFormModal } from '../features/users/UserFormModal'
import { AppUser } from '../types'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const ROLE_COLORS: Record<string, string> = {
  admin:   'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewer:  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

export const Users: React.FC = () => {
  const { t } = useTranslation()
  const currentUser = useAuthStore((s) => s.user)
  const { users, isLoading, fetchUsers, deleteUser } = useUsersStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editUser, setEditUser] = useState<AppUser | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers().catch(() => toast.error('Failed to load users'))
  }, [fetchUsers])

  // Guard: only admins can access this page
  if (currentUser && currentUser.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id)
      setConfirmDelete(null)
      toast.success(t('users.userDeleted'))
    } catch {
      toast.error('Failed to delete user')
    }
  }

  const handleEdit = (user: AppUser) => {
    setEditUser(user)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setEditUser(null)
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setEditUser(null)
  }

  if (isLoading && users.length === 0) {
    return (
      <div className="px-4 md:px-6 pt-14 md:pt-6 space-y-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div>
        <div className="px-4 md:px-6 pt-14 md:pt-6 pb-4">
          <PageHeader
            title={t('users.title')}
            action={<Button onClick={handleAdd} icon={<PlusIcon />}>{t('users.addUser')}</Button>}
          />
        </div>
        <EmptyState
          icon="👤"
          title={t('users.noUsers')}
          description={t('users.noUsersDesc')}
          action={{ label: t('users.addUser'), onClick: handleAdd }}
        />
        <UserFormModal open={formOpen} onClose={handleClose} editUser={editUser} />
      </div>
    )
  }

  return (
    <div className="pb-6">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 pt-14 md:pt-6 pb-4 sticky top-0 z-30">
        <PageHeader
          title={t('users.title')}
          subtitle={t('users.subtitle', { count: users.length })}
          action={<Button onClick={handleAdd} size="sm" icon={<PlusIcon />}>{t('users.addUser')}</Button>}
        />
      </div>

      <div className="px-4 md:px-6 pt-4 space-y-2">
        {users.map((user) => {
          const isSelf = user.id === currentUser?.id
          return (
            <div
              key={user.id}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-card px-4 py-3 flex items-center gap-3"
            >
              {/* Avatar */}
              <div className={clsx('w-10 h-10 rounded-2xl flex items-center justify-center text-base font-bold flex-shrink-0', ROLE_BG[user.role])}>
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{user.name}</p>
                  {isSelf && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                      {t('users.you')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>

              {/* Role badge */}
              <span className={clsx('text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0', ROLE_COLORS[user.role])}>
                {t(`users.roles.${user.role}`)}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEdit(user)}
                  className="p-2 rounded-xl text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  <EditIcon />
                </button>
                {!isSelf && (
                  confirmDelete === user.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(user.id)} className="text-xs px-2.5 py-1 bg-red-500 text-white rounded-xl font-semibold">{t('common.delete')}</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold">{t('common.cancel')}</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(user.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  )
                )}
              </div>
            </div>
          )
        })}
      </div>

      <UserFormModal open={formOpen} onClose={handleClose} editUser={editUser} />
    </div>
  )
}

const ROLE_BG: Record<string, string> = {
  admin:   'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
  manager: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  viewer:  'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
}

function PlusIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
}
function EditIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
}
function TrashIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
}
