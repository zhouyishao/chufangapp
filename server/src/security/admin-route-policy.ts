import type { AdminPermissionKey } from './admin-permissions';

type PermissionFamily = {
  prefix: string;
  view: AdminPermissionKey;
  create?: AdminPermissionKey;
  update?: AdminPermissionKey;
  status?: AdminPermissionKey;
  delete?: AdminPermissionKey;
  manage?: AdminPermissionKey;
};

export const ADMIN_ROUTE_FAMILIES: readonly PermissionFamily[] = [
  { prefix: 'categories', view: 'taxonomy:view', create: 'taxonomy:create', update: 'taxonomy:update', status: 'taxonomy:status', delete: 'taxonomy:delete' },
  { prefix: 'tags', view: 'taxonomy:view', create: 'taxonomy:create', update: 'taxonomy:update', status: 'taxonomy:status', delete: 'taxonomy:delete' },
  { prefix: 'cuisines', view: 'taxonomy:view', create: 'taxonomy:create', update: 'taxonomy:update', delete: 'taxonomy:delete' },
  { prefix: 'ingredients', view: 'content:ingredient:view', create: 'content:ingredient:create', update: 'content:ingredient:update', status: 'content:ingredient:publish', delete: 'content:ingredient:delete' },
  { prefix: 'seasonal-foods', view: 'content:ingredient:view', create: 'content:ingredient:create', update: 'content:ingredient:update', delete: 'content:ingredient:delete' },
  { prefix: 'recipes', view: 'content:recipe:view', create: 'content:recipe:create', update: 'content:recipe:update', status: 'content:recipe:publish', delete: 'content:recipe:delete' },
  { prefix: 'recommendations', view: 'content:recipe:view', create: 'content:recipe:create', update: 'content:recipe:update', status: 'content:recipe:publish', delete: 'content:recipe:delete' },
  { prefix: 'beverages', view: 'content:beverage:view', create: 'content:beverage:create', update: 'content:beverage:update', status: 'content:beverage:publish', delete: 'content:beverage:delete' },
  { prefix: 'banners', view: 'home:configuration:view', create: 'home:configuration:create', update: 'home:configuration:update', status: 'home:configuration:status', delete: 'home:configuration:delete' },
  { prefix: 'home', view: 'home:configuration:view', create: 'home:configuration:create', update: 'home:configuration:update', status: 'home:configuration:status', delete: 'home:configuration:delete' },
  { prefix: 'menus', view: 'content:configuration:view', manage: 'content:configuration:manage' },
  { prefix: 'channels', view: 'content:configuration:view', manage: 'content:configuration:manage' },
  { prefix: 'families', view: 'family:view', manage: 'family:manage' },
  { prefix: 'users', view: 'user:account:view', create: 'user:account:create', update: 'user:account:update', status: 'user:account:status', delete: 'user:account:delete' },
  { prefix: 'posts', view: 'audit:view', manage: 'audit:manage' },
  { prefix: 'audits', view: 'audit:view', manage: 'audit:manage' },
  { prefix: 'comments', view: 'comment:view', manage: 'comment:manage' },
  { prefix: 'purchase-lists', view: 'purchase:view' },
  { prefix: 'search-logs', view: 'search:log:view' },
  { prefix: 'upload', view: 'file:view', manage: 'file:upload' },
  { prefix: 'files', view: 'file:view', delete: 'file:delete' },
  { prefix: 'resource-api-providers', view: 'resource:view', manage: 'resource:manage' },
  { prefix: 'resource-apps', view: 'resource:view', manage: 'resource:manage' },
  { prefix: 'resource-api-keys', view: 'resource:view', manage: 'resource:manage' },
  { prefix: 'resource-permissions', view: 'resource:view', manage: 'resource:manage' },
  { prefix: 'resource-logs', view: 'resource:view' },
  { prefix: 'resource-imports', view: 'resource:view', manage: 'resource:import' },
  { prefix: 'content-selector', view: 'resource:view' },
  { prefix: 'admins', view: 'system:admin:view', manage: 'system:admin:manage' },
  { prefix: 'roles', view: 'system:role:view', manage: 'system:role:manage' },
  { prefix: 'permissions', view: 'system:role:view' },
  { prefix: 'operation-logs', view: 'system:log:view' }
] as const;

const normalizedPath = (requestPath: string) => (requestPath.split('?')[0] ?? '').replace(/^\/+|\/+$/g, '');

const isStatusAction = (value: string) => /\/(?:publish|recommend|status|enable|disable|sort|reorder)(?:\/|$)/.test(`/${value}`);

export const permissionForAdminRequest = (method: string, requestPath: string): AdminPermissionKey | null => {
  const cleanPath = normalizedPath(requestPath);
  const family = ADMIN_ROUTE_FAMILIES.find(({ prefix }) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`));
  if (!family) return null;

  const normalizedMethod = method.toUpperCase();
  if (normalizedMethod === 'GET' || normalizedMethod === 'HEAD') {
    if (family.prefix === 'users' && /^(?:users)\/(?:behavior|favorites|recent-views)(?:\/|$)/.test(cleanPath)) {
      return 'user:behavior:view';
    }
    return family.view;
  }
  if (normalizedMethod === 'DELETE') return family.delete ?? family.manage ?? null;
  if (isStatusAction(cleanPath)) return family.status ?? family.manage ?? family.update ?? null;
  if (family.prefix === 'users' && /\/password(?:\/|$)/.test(`/${cleanPath}`)) return 'user:account:reset-password';
  if (normalizedMethod === 'POST' && cleanPath === family.prefix) return family.create ?? family.manage ?? null;
  if (normalizedMethod === 'POST') return family.manage ?? family.create ?? family.update ?? null;
  if (normalizedMethod === 'PUT' || normalizedMethod === 'PATCH') return family.update ?? family.manage ?? null;
  return null;
};
