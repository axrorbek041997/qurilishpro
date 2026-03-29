import React from 'react'
import clsx from 'clsx'

interface SkeletonProps {
  className?: string
  lines?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={clsx('animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl', className)} />
)

export const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card">
    <Skeleton className="h-4 w-1/3 mb-3" />
    <Skeleton className="h-8 w-2/3 mb-2" />
    <Skeleton className="h-3 w-1/2" />
  </div>
)

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-16 rounded-xl" />
      </div>
    ))}
  </div>
)
