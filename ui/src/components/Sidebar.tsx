import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProjectsStore } from '../store/useProjectsStore'
import { useAppStore } from '../store/useAppStore'
import clsx from 'clsx'

export const Sidebar: React.FC = () => {
  const { t } = useTranslation()
  const { getActiveProject } = useProjectsStore()
  const { darkMode, toggleDarkMode, language, setLanguage } = useAppStore()
  const project = getActiveProject()

  const navItems = [
    { to: '/',          label: t('nav.dashboard'), icon: <HomeIcon /> },
    { to: '/projects',  label: t('nav.projects'),  icon: <ProjectsIcon /> },
    { to: '/workers',   label: t('nav.workers'),   icon: <WorkersIcon /> },
    { to: '/expenses',  label: t('nav.expenses'),  icon: <ExpensesIcon /> },
    { to: '/materials', label: t('nav.materials'), icon: <MaterialsIcon /> },
    { to: '/reports',   label: t('nav.reports'),   icon: <ReportsIcon /> },
  ]

  const statusLabel = project
    ? t(`status.${project.status}`)
    : null

  return (
    <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-40">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
            🏗
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{t('app.name')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('app.tagline')}</p>
          </div>
        </div>
      </div>

      {/* Active project chip */}
      {project && (
        <div className="px-4 py-3 mx-3 mt-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx('w-1.5 h-1.5 rounded-full', project.status === 'active' ? 'bg-emerald-500 animate-pulse' : project.status === 'paused' ? 'bg-amber-400' : 'bg-slate-400')} />
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
              {statusLabel}
            </span>
          </div>
          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{project.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">📍 {project.location}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2 space-y-1">
        {/* Language switcher */}
        <div className="flex gap-1 px-4 py-2">
          {(['uz', 'en', 'ru'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={clsx(
                'flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors',
                language === lang
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
              )}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <span className="text-base">{darkMode ? '☀️' : '🌙'}</span>
          {darkMode ? t('app.lightMode') : t('app.darkMode')}
        </button>
      </div>
    </aside>
  )
}

function HomeIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
}
function ProjectsIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
}
function WorkersIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function ExpensesIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
}
function MaterialsIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
}
function ReportsIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
}
