import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, JwtPayload } from '../utils/jwt'
import { AppError } from '../utils/AppError'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No access token provided', 401))
  }

  const token = authHeader.slice(7)
  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    next(new AppError('Invalid or expired access token', 401))
  }
}
