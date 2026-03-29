import React, { useState, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/useAuthStore'
import { useAppStore } from '../store/useAppStore'
import clsx from 'clsx'

export const Login: React.FC = () => {
  const { t } = useTranslation()
  const { login, isLoading } = useAuthStore()
  const { darkMode, toggleDarkMode, language, setLanguage } = useAppStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) { setError('Email is required'); return }
    if (!password)     { setError('Password is required'); return }

    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Try again.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Language selector */}
        <div className="flex gap-1">
          {(['uz', 'en', 'ru'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-xs font-bold transition-colors',
                language === lang
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800',
              )}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo + title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl shadow-lg mb-4">
              <span className="text-3xl">🏗</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t('app.name')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {t('app.tagline')}
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card p-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">
              Sign in to your account
            </h2>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-2.5">
                <span className="text-red-500 text-sm mt-0.5 flex-shrink-0">⚠️</span>
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email */}
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null) }}
                  placeholder="admin@qurilishpro.uz"
                  className={clsx(
                    'w-full rounded-2xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
                    'text-base py-3 px-4 transition-colors outline-none',
                    'focus:ring-2 focus:ring-primary-400 focus:border-transparent',
                    error
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-slate-200 dark:border-slate-700',
                  )}
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null) }}
                    placeholder="••••••••"
                    className={clsx(
                      'w-full rounded-2xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
                      'text-base py-3 pl-4 pr-12 transition-colors outline-none',
                      'focus:ring-2 focus:ring-primary-400 focus:border-transparent',
                      error
                        ? 'border-red-300 dark:border-red-700'
                        : 'border-slate-200 dark:border-slate-700',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={clsx(
                  'w-full py-3.5 rounded-2xl font-bold text-white text-base transition-all',
                  'bg-primary-500 hover:bg-primary-600 active:scale-[0.98]',
                  'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2',
                  'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
                  'mt-2',
                )}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Qurilish Pro &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)
