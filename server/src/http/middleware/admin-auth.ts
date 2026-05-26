import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '../../config';
import { fail } from '../response';

export type AdminJwtPayload = {
  sub: string;
  username: string;
};

declare module 'express-serve-static-core' {
  interface Request {
    admin?: AdminJwtPayload;
  }
}

export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.header('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    res.status(401).json(fail(401, 'unauthorized'));
    return;
  }
  const token = header.slice('bearer '.length).trim();
  try {
    const decoded = jwt.verify(token, config.jwtAdminSecret) as AdminJwtPayload;
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json(fail(401, 'unauthorized'));
  }
};

