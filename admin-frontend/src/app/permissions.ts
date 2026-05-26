import { loadAdminUser } from './storage';

export type AdminPermission = string;

export const getCurrentPermissions = (): AdminPermission[] => {
  const admin = loadAdminUser();
  if (!admin) return [];
  return ['*'];
};

export const canAccess = (permission?: AdminPermission) => {
  if (!permission) return true;
  const permissions = getCurrentPermissions();
  return permissions.includes('*') || permissions.includes(permission);
};
