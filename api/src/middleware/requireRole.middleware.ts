import { Request, Response, NextFunction } from 'express'

export function requireRole(...roles: string[]) {
  return (req: Request, _: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const err: any = new Error('Forbidden')
      err.statusCode = 403
      return next(err)
    }
    next()
  }
}
