import React from 'react'
import clsx from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  icon,
  iconRight,
  className,
  id,
  ...props
}) => {
  const inputId = id ?? `input-${label?.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          {...props}
          className={clsx(
            'w-full rounded-2xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
            'transition-all duration-150',
            'text-base py-3',
            icon ? 'pl-10 pr-4' : 'px-4',
            iconRight ? 'pr-10' : '',
            error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-slate-200 dark:border-slate-700',
            className,
          )}
        />
        {iconRight && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
            {iconRight}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className, id, ...props }) => {
  const selectId = id ?? `select-${label?.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        {...props}
        className={clsx(
          'w-full rounded-2xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
          'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
          'transition-all duration-150 text-base py-3 px-4',
          error ? 'border-red-400' : 'border-slate-200 dark:border-slate-700',
          className,
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className, id, ...props }) => {
  const taId = id ?? `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={taId} className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <textarea
        id={taId}
        {...props}
        className={clsx(
          'w-full rounded-2xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
          'placeholder:text-slate-400 dark:placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
          'transition-all duration-150 text-base py-3 px-4 resize-none',
          error ? 'border-red-400' : 'border-slate-200 dark:border-slate-700',
          className,
        )}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}
