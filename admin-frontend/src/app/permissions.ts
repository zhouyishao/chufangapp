import { loadAdminUser } from './storage';
import type { AdminNavItem } from './navigation';

export type AdminPermission = string;

export const getCurrentPermissions = (): AdminPermission[] => {
  const admin = loadAdminUser();
  if (!admin) return [];
  return admin.permissions;
};

export const canAccess = (permission?: AdminPermission) => {
  if (!permission) return true;
  const permissions = getCurrentPermissions();
  return permissions.includes('*') || permissions.includes(permission);
};

export const hasPermission = (permissions: readonly string[], permission?: string) =>
  !permission || permissions.includes('*') || permissions.includes(permission);

export const filterNavigationByAccess = (
  items: readonly AdminNavItem[],
  permissions: readonly string[] = getCurrentPermissions()
): AdminNavItem[] => items.flatMap((item) => {
  const children = item.children ? filterNavigationByAccess(item.children, permissions) : undefined;
  if (!hasPermission(permissions, item.permission) && !children?.length) return [];
  return [{ ...item, ...(children ? { children } : {}) }];
});
