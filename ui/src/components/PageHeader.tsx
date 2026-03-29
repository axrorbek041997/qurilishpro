import React from 'react'
import clsx from 'clsx'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, className }) => {
  return (
    <div className={clsx('flex items-start justify-between mb-4', className)}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  )
}
