import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError'
import { env } from '../config/env'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message })
    return
  }

  // Mongoose duplicate key error
  if ((err as NodeJS.ErrnoException).name === 'MongoServerError' && (err as { code?: number }).code === 11000) {
    res.status(409).json({ success: false, message: 'Duplicate entry' })
    return
  }

  console.error('Unhandled error:', err)

  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
}
