import { Request, Response, NextFunction } from 'express';
import {verifyAccessToken} from "../utils/jwt";

export default async function (req: Request, _: Response, next: NextFunction) {
  try {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer '))
      throw {
        statusCode: 401,
        name: 'AuthenticationError',
        message: 'Unauthorized',
      };

    const token = auth.split(' ')[1];
    const decodedPayload = verifyAccessToken(token);

    req.user = decodedPayload as any;
    req.token = token;

    next();
  } catch (e: any) {
    e.statusCode = 401;
    next(e);
  }
}
