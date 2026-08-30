import type { NextFunction, Request, Response } from 'express';

import type { AdminPermissionKey } from '../../security/admin-permissions';
import { permissionForAdminRequest } from '../../security/admin-route-policy';
import { fail } from '../response';

const hasPermission = (req: Request, permission: AdminPermissionKey) => {
  const permissions = req.adminAccess?.permissions ?? [];
  return permissions.includes('*') || permissions.includes(permission);
};

export const requireAdminPermission = (permission: AdminPermissionKey) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.adminAccess) {
      res.status(401).json(fail(401, 'unauthorized'));
      return;
    }
    if (!hasPermission(req, permission)) {
      res.status(403).json(fail(403, '无权限执行此操作'));
      return;
    }
    next();
  };

export const requireAdminRouteAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.adminAccess) {
    res.status(401).json(fail(401, 'unauthorized'));
    return;
  }
  const permission = permissionForAdminRequest(req.method, req.path);
  if (!permission || !hasPermission(req, permission)) {
    res.status(403).json(fail(403, '无权限执行此操作'));
    return;
  }
  next();
};
