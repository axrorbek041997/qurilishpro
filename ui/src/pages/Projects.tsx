import React, { useState } from 'react'
import { format, differenceInDays } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { useProjectsStore } from '../store/useProjectsStore'
import { useWorkersStore } from '../store/useWorkersStore'
import { useExpensesStore } from '../store/useExpensesStore'
import { useMaterialsStore } from '../store/useMaterialsStore'
import { ProjectFormModal } from '../features/projects/ProjectFormModal'
import { SchemaViewerModal } from '../features/projects/SchemaViewerModal'
import { Project } from '../types'
import clsx from 'clsx'
import toast from 'react-hot-toast'

export const Projects: React.FC = () => {
  const { t } = useTranslation()
  const { projects, activeProjectId, setActiveProject, deleteProject } = useProjectsStore()
  const { removeWorkersForProject } = useWorkersStore()
  const { removeExpensesForProject } = useExpensesStore()
  const { removeMaterialsForProject } = useMaterialsStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [schemaProject, setSchemaProject] = useState<Project | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id)
      // Clear related local state (server cascade handles DB cleanup)
      removeWorkersForProject(id)
      removeExpensesForProject(id)
      removeMaterialsForProject(id)
      setConfirmDelete(null)
      toast.success(t('projects.projectDeleted'))
    } catch {
      toast.error('Failed to delete project')
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingProject(undefined)
  }

  const handleSetActive = (id: string) => {
    setActiveProject(id)
    toast.success(t('projects.projectSwitched'))
  }

  const activeCount = projects.filter((p) => p.status === 'active').length

  return (
    <div className="pb-24 md:pb-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 pt-14 md:pt-6 pb-4 sticky top-0 z-30">
        <PageHeader
          title={t('projects.title')}
          subtitle={t('projects.subtitle', { count: projects.length, active: activeCount })}
          action={
            <Button
              size="sm"
              icon={<PlusIcon />}
              onClick={() => { setEditingProject(undefined); setFormOpen(true) }}
            >
              {t('projects.newProject')}
            </Button>
          }
        />
      </div>

      {/* Projects grid */}
      <div className="px-4 md:px-6 pt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon="🏗️"
              title={t('projects.noProjects')}
              description={t('projects.noProjectsDesc')}
              action={{ label: t('projects.newProject'), onClick: () => setFormOpen(true) }}
            />
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isActive={project.id === activeProjectId}
              onSetActive={() => handleSetActive(project.id)}
              onEdit={() => handleEdit(project)}
              onViewSchemas={() => setSchemaProject(project)}
              onDelete={() => setConfirmDelete(project.id)}
              confirmDelete={confirmDelete === project.id}
              onConfirmDelete={() => handleDelete(project.id)}
              onCancelDelete={() => setConfirmDelete(null)}
            />
          ))
        )}
      </div>

      {/* FAB mobile */}
      <button
        onClick={() => { setEditingProject(undefined); setFormOpen(true) }}
        className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl shadow-lg flex items-center justify-center text-2xl transition-all active:scale-95 z-40"
      >
        +
      </button>

      <ProjectFormModal
        open={formOpen}
        onClose={handleFormClose}
        editProject={editingProject}
      />

      {schemaProject && (
        <SchemaViewerModal
          open={!!schemaProject}
          onClose={() => setSchemaProject(null)}
          projectId={schemaProject.id}
          projectName={schemaProject.name}
        />
      )}
    </div>
  )
}

// ── Project Card ─────────────────────────────────────────────────────────────
interface CardProps {
  project: Project
  isActive: boolean
  onSetActive: () => void
  onEdit: () => void
  onViewSchemas: () => void
  onDelete: () => void
  confirmDelete: boolean
  onConfirmDelete: () => void
  onCancelDelete: () => void
}

const ProjectCard: React.FC<CardProps> = ({
  project, isActive,
  onSetActive, onEdit, onViewSchemas, onDelete,
  confirmDelete, onConfirmDelete, onCancelDelete,
}) => {
  const { t } = useTranslation()
  const { getWorkersForProject } = useWorkersStore()
  const { getStockForProject } = useMaterialsStore()

  const workerCount = getWorkersForProject(project.id).length
  const lowStockCount = getStockForProject(project.id).filter((s) => s.isLow).length

  const daysRunning = differenceInDays(new Date(), new Date(project.startDate))

  const budgetStr = project.budget
    ? new Intl.NumberFormat('uz-UZ').format(project.budget) + ' ' + t('common.uzsShort')
    : null

  const filesLabel = t('projects.filesCount', { count: project.schemas.length })

  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-800 rounded-2xl shadow-card overflow-hidden transition-all',
        isActive && 'ring-2 ring-primary-400 dark:ring-primary-500',
      )}
    >
      {/* Top accent */}
      <div
        className={clsx(
          'h-1.5',
          project.status === 'active'    && 'bg-gradient-to-r from-primary-500 to-emerald-400',
          project.status === 'paused'    && 'bg-gradient-to-r from-amber-400 to-orange-400',
          project.status === 'completed' && 'bg-gradient-to-r from-slate-300 to-slate-400',
        )}
      />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                {project.name}
              </h3>
              {isActive && (
                <span className="flex items-center gap-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                  {t('projects.activeLabel')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              <span>📍</span>
              <span className="truncate">{project.location}</span>
            </div>
          </div>
          <span className={clsx(
            'flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold',
            project.status === 'active' ? 'bg-emerald-100 text-emerald-700' : project.status === 'paused' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600',
          )}>
            {t(`status.${project.status}`)}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Stat label={t('projects.stats.workers')} value={String(workerCount)} icon="👷" />
          <Stat label={t('projects.stats.running')} value={`${daysRunning}d`} icon="📅" />
          <Stat
            label={t('projects.stats.stock')}
            value={lowStockCount > 0 ? `${lowStockCount} low` : 'OK'}
            icon={lowStockCount > 0 ? '⚠️' : '✅'}
            warn={lowStockCount > 0}
          />
        </div>

        {/* Budget */}
        {budgetStr && (
          <div className="mb-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('projects.budget')}</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{budgetStr}</span>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-3 mb-4 text-xs text-slate-400">
          <span>📆 {t('projects.started')} {format(new Date(project.startDate), 'dd MMM yyyy')}</span>
          {project.endDate && (
            <span>→ {format(new Date(project.endDate), 'dd MMM yyyy')}</span>
          )}
        </div>

        {/* Schemas count */}
        <button
          onClick={onViewSchemas}
          className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors mb-3 group"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">📐</span>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              {t('projects.schemasLabel')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-blue-500 dark:text-blue-400 font-bold">
              {filesLabel}
            </span>
            <svg className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Actions */}
        {confirmDelete ? (
          <div className="flex gap-2">
            <button
              onClick={onConfirmDelete}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              {t('projects.deleteProject')}
            </button>
            <button
              onClick={onCancelDelete}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
            >
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {!isActive && (
              <button
                onClick={onSetActive}
                className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors"
              >
                {t('projects.setActive')}
              </button>
            )}
            <button
              onClick={onEdit}
              className={clsx(
                'py-2.5 rounded-xl text-sm font-semibold transition-colors',
                isActive ? 'flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600' : 'px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200',
              )}
            >
              {t('common.edit')}
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title={t('projects.deleteProject')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const Stat: React.FC<{ label: string; value: string; icon: string; warn?: boolean }> = ({
  label, value, icon, warn,
}) => (
  <div className={clsx(
    'rounded-xl px-2 py-1.5 text-center',
    warn ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-50 dark:bg-slate-700/50',
  )}>
    <p className="text-sm">{icon}</p>
    <p className={clsx('text-xs font-bold', warn ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200')}>
      {value}
    </p>
    <p className="text-xs text-slate-400">{label}</p>
  </div>
)

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
