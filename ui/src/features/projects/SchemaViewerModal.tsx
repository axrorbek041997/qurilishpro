import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { useProjectsStore } from '../../store/useProjectsStore'
import { DxfRenderer } from './DxfRenderer'
import { ProjectSchema, SchemaFileType } from '../../types'
import { format } from 'date-fns'
import { useAppStore } from '../../store/useAppStore'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

export const SchemaViewerModal: React.FC<Props> = ({
  open, onClose, projectId, projectName,
}) => {
  const { t } = useTranslation()
  const { addSchema, addRar, removeSchema, getProject, fetchSchemaContent } = useProjectsStore()
  const { darkMode } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const project = getProject(projectId)
  const schemas = project?.schemas ?? []

  const [activeSchemaId, setActiveSchemaId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [activeContent, setActiveContent] = useState<string | undefined>()
  const [contentLoading, setContentLoading] = useState(false)

  const activeSchema = schemas.find((s) => s.id === activeSchemaId) ?? schemas[0]

  // Fetch schema content when active schema changes
  useEffect(() => {
    if (!activeSchema) { setActiveContent(undefined); return }
    setContentLoading(true)
    fetchSchemaContent(projectId, activeSchema)
      .then((content) => setActiveContent(content))
      .catch(() => toast.error(t('schemas.uploadFailed')))
      .finally(() => setContentLoading(false))
  }, [activeSchema?.id, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      const isRar = file.name.toLowerCase().endsWith('.rar')
      const maxSize = isRar ? 100 * 1024 * 1024 : MAX_FILE_SIZE

      if (file.size > maxSize) {
        toast.error(t('schemas.fileTooLarge', { size: formatBytes(maxSize) }))
        return
      }

      setUploading(true)
      const upload = isRar ? addRar(projectId, file) : addSchema(projectId, file)
      upload
        .then(() => toast.success(t('schemas.uploadSuccess', { name: file.name })))
        .catch(() => toast.error(t('schemas.uploadFailed')))
        .finally(() => setUploading(false))
    },
    [projectId, addSchema, addRar, t],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect],
  )

  const handleRemove = async (schemaId: string) => {
    if (activeSchemaId === schemaId) { setActiveSchemaId(null); setActiveContent(undefined) }
    try {
      await removeSchema(projectId, schemaId)
      setConfirmDelete(null)
      toast.success(t('schemas.schemaRemoved'))
    } catch {
      toast.error('Failed to remove schema')
    }
  }

  const renderViewer = () => {
    if (!activeSchema) {
      return (
        <div
          className="flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl m-4 cursor-pointer hover:border-primary-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <span className="text-5xl">📐</span>
          <div className="text-center">
            <p className="font-semibold text-slate-700 dark:text-slate-300">{t('schemas.dropFile')}</p>
            <p className="text-sm text-slate-400 mt-1">{t('schemas.dropDesc')}</p>
            <p className="text-xs text-slate-300 dark:text-slate-500 mt-0.5">{t('schemas.maxSize')}</p>
          </div>
          <button className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors">
            {t('schemas.browseFiles')}
          </button>
        </div>
      )
    }

    if (contentLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-sm">{t('schemas.uploading')}</p>
          </div>
        </div>
      )
    }

    if (!activeContent) return null

    if (activeSchema.fileType === 'dxf') {
      return (
        <div className="flex-1 min-h-0">
          <DxfRenderer content={activeContent} isDark={darkMode} />
        </div>
      )
    }

    if (activeSchema.fileType === 'svg') {
      return (
        <div className="flex-1 min-h-0 overflow-auto p-4 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="max-w-full max-h-full" dangerouslySetInnerHTML={{ __html: activeContent }} />
        </div>
      )
    }

    if (activeSchema.fileType === 'pdf') {
      return (
        <div className="flex-1 min-h-0">
          <iframe src={activeContent} className="w-full h-full rounded-2xl" title={activeSchema.name} />
        </div>
      )
    }

    if (activeSchema.fileType === 'image') {
      return (
        <div className="flex-1 min-h-0 overflow-auto p-4 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <img src={activeContent} alt={activeSchema.name} className="max-w-full max-h-full object-contain rounded-xl shadow-card" draggable={false} />
        </div>
      )
    }

    // dwg, xls, doc, other — download link
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 p-8">
        <span className="text-6xl">{fileTypeIcon(activeSchema.fileType)}</span>
        <p className="font-semibold text-slate-700 dark:text-slate-300 text-center">{activeSchema.name}</p>
        <p className="text-sm text-slate-400">{formatBytes(activeSchema.size)}</p>
        <a
          href={activeContent}
          download={activeSchema.name}
          className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          ⬇ {t('common.export')}
        </a>
      </div>
    )
  }

  const fileTypeIcon = (ft: SchemaFileType) =>
    ({ dxf: '📐', pdf: '📄', image: '🖼️', svg: '✏️', dwg: '📐', xls: '📊', doc: '📝', other: '📎' }[ft])

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-stretch justify-stretch p-2 md:p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="flex-1 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <span className="text-xl">📐</span>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="font-bold text-slate-900 dark:text-white truncate">
                    {t('schemas.title', { project: projectName })}
                  </Dialog.Title>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('schemas.filesCount', { count: schemas.length })}
                  </p>
                </div>
                <label className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors">
                  {uploading ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <span>+</span>
                  )}
                  {uploading ? t('schemas.uploading') : t('schemas.upload')}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".dxf,.pdf,.png,.jpg,.jpeg,.svg,.webp,.dwg,.xls,.xlsx,.doc,.docx,.rar"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </label>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body: sidebar + viewer */}
              <div className="flex flex-1 min-h-0">
                {schemas.length > 0 && (
                  <div className="w-56 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 overflow-y-auto bg-slate-50 dark:bg-slate-800/50">
                    <div className="p-2 space-y-1">
                      {schemas.map((schema) => {
                        const isActive = (activeSchemaId ?? schemas[0]?.id) === schema.id
                        return (
                          <div key={schema.id} className="relative group">
                            <button
                              onClick={() => setActiveSchemaId(schema.id)}
                              className={clsx(
                                'w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all',
                                isActive
                                  ? 'bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-300 dark:ring-primary-700'
                                  : 'hover:bg-white dark:hover:bg-slate-700',
                              )}
                            >
                              <span className="text-lg flex-shrink-0 mt-0.5">{fileTypeIcon(schema.fileType)}</span>
                              <div className="min-w-0 flex-1">
                                <p className={clsx(
                                  'text-xs font-semibold truncate',
                                  isActive ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300',
                                )}>
                                  {schema.name}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {formatBytes(schema.size)}
                                </p>
                                <p className="text-xs text-slate-300 dark:text-slate-500">
                                  {format(new Date(schema.uploadedAt), 'dd/MM/yy')}
                                </p>
                              </div>
                            </button>

                            {confirmDelete === schema.id ? (
                              <div className="absolute inset-x-1 bottom-1 flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-lg z-10">
                                <button onClick={() => handleRemove(schema.id)} className="flex-1 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold">{t('common.delete')}</button>
                                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold">{t('common.cancel')}</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(schema.id)}
                                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div
                  className="flex-1 flex flex-col min-h-0 min-w-0"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {renderViewer()}
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
