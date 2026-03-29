import React from 'react'
import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick,
  padding = 'md',
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white dark:bg-slate-800 rounded-2xl shadow-card',
        paddings[padding],
        onClick && 'cursor-pointer active:scale-[0.99] transition-transform',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: string
  trend?: { value: number; label: string }
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'bg-primary-50 text-primary-600',
}) => {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white truncate">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={clsx('flex-shrink-0 ml-3 p-3 rounded-2xl text-xl', color)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
