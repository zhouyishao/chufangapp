import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '../../config';
import { loadAdminAccess, type AdminAccessContext } from '../../security/admin-access';
import { fail } from '../response';

export type AdminJwtPayload = {
  sub: string;
  username: string;
};

declare module 'express-serve-static-core' {
  interface Request {
    admin?: AdminJwtPayload;
    adminAccess?: AdminAccessContext;
  }
}

export const requireAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (req.admin && req.adminAccess) {
    next();
    return;
  }
  const header = req.header('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    res.status(401).json(fail(401, 'unauthorized'));
    return;
  }
  const token = header.slice('bearer '.length).trim();
  try {
    const decoded = jwt.verify(token, config.jwtAdminSecret) as AdminJwtPayload;
    const adminId = Number.parseInt(decoded.sub, 10);
    if (!Number.isFinite(adminId) || !decoded.username) {
      res.status(401).json(fail(401, 'unauthorized'));
      return;
    }
    const access = await loadAdminAccess(adminId);
    if (!access || access.admin.username !== decoded.username) {
      res.status(401).json(fail(401, 'unauthorized'));
      return;
    }
    req.admin = decoded;
    req.adminAccess = access;
    next();
  } catch {
    res.status(401).json(fail(401, 'unauthorized'));
  }
};
