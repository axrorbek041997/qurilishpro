import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

export default function (req: Request, _: Response, next: NextFunction) {
  try {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      return next(new AppError('Unauthorized', 401));
    }

    const token = auth.split(' ')[1];
    const decodedPayload = verifyAccessToken(token);

    req.user = decodedPayload as any;
    req.token = token;

    next();
  } catch {
    next(new AppError('Unauthorized', 401));
  }
}
