import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { useProjectsStore } from './store/useProjectsStore'
import { Sidebar } from './components/Sidebar'
import { BottomNav } from './components/BottomNav'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Workers } from './pages/Workers'
import { Expenses } from './pages/Expenses'
import { Materials } from './pages/Materials'
import { Reports } from './pages/Reports'
import { Projects } from './pages/Projects'
import { Users } from './pages/Users'

const AuthLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg animate-pulse">
        🏗
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  </div>
)

const AppLayout: React.FC = () => {
  const { fetchProjects } = useProjectsStore()

  // Fetch projects once on app load after authentication
  useEffect(() => {
    fetchProjects().catch(() => {/* handled per page */})
  }, [fetchProjects])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="md:pl-64 pb-20 md:pb-0 min-h-screen">
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/projects"  element={<Projects />} />
          <Route path="/workers"   element={<Workers />} />
          <Route path="/expenses"  element={<Expenses />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/reports"   element={<Reports />} />
          <Route path="/users"     element={<Users />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

const App: React.FC = () => {
  const { user, isInitialized, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!isInitialized) return <AuthLoader />

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/*"
        element={user ? <AppLayout /> : <Navigate to="/login" replace />}
      />
    </Routes>
  )
}

export default App
