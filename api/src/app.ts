import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import { env } from './config/env'
import { errorHandler } from './middleware/errorHandler.middleware'
import { authenticate } from './middleware/auth.middleware'
import authRoutes from './routes/auth.routes'
import projectRoutes from './routes/project.routes'
import workerRoutes from './routes/worker.routes'
import expenseRoutes from './routes/expense.routes'
import materialRoutes from './routes/material.routes'
import reportRoutes from './routes/report.routes'

const app = express()

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Parsers ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ── Logging ───────────────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',      authRoutes)
app.use('/api/v1/projects',  authenticate, projectRoutes)
app.use('/api/v1/workers',   authenticate, workerRoutes)
app.use('/api/v1/expenses',  authenticate, expenseRoutes)
app.use('/api/v1/materials', authenticate, materialRoutes)
app.use('/api/v1/reports',   authenticate, reportRoutes)

// ── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler)

export default app
