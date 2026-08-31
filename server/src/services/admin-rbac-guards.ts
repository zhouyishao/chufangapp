import { HttpError } from '../http/errors';

export type AdminMutation = 'DISABLE' | 'DELETE' | 'CHANGE_ROLE';

export const assertAdminMutationAllowed = (input: {
  actorId: number;
  targetId: number;
  mutation: AdminMutation;
  targetIsSuperAdmin: boolean;
  activeSuperAdminCount: number;
}) => {
  if (input.actorId === input.targetId && input.mutation === 'DISABLE') {
    throw new HttpError('不能停用当前登录账号', 409, 409);
  }
  if (input.actorId === input.targetId && input.mutation === 'DELETE') {
    throw new HttpError('不能删除当前登录账号', 409, 409);
  }
  if (input.targetIsSuperAdmin && input.activeSuperAdminCount <= 1) {
    throw new HttpError('系统必须至少保留一个有效的超级管理员', 409, 409);
  }
};

export type RoleMutation = 'DELETE' | 'DISABLE' | 'CHANGE_CODE' | 'REPLACE_PERMISSIONS';

export const assertRoleMutationAllowed = (input: {
  isSystem: boolean;
  code: string;
  adminCount: number;
  mutation: RoleMutation;
}) => {
  if (input.code === 'SUPER_ADMIN' && input.mutation === 'REPLACE_PERMISSIONS') {
    throw new HttpError('超级管理员权限固定，不可修改', 409, 409);
  }
  if (input.isSystem && input.mutation === 'DELETE') {
    throw new HttpError('系统角色不可删除', 409, 409);
  }
  if (input.isSystem && input.mutation === 'CHANGE_CODE') {
    throw new HttpError('系统角色编码不可修改', 409, 409);
  }
  if (input.adminCount > 0 && (input.mutation === 'DELETE' || input.mutation === 'DISABLE')) {
    throw new HttpError('该角色仍有管理员使用，不能停用或删除', 409, 409);
  }
};

export const validatePermissionReplacement = (
  permissionIds: number[],
  permissions: Array<{ id: number; status: 'ACTIVE' | 'DISABLED'; deletedAt: Date | null }>
) => {
  const uniqueIds = Array.from(new Set(permissionIds));
  const validIds = new Set(permissions.filter((permission) => permission.status === 'ACTIVE' && !permission.deletedAt).map((permission) => permission.id));
  if (uniqueIds.some((id) => !validIds.has(id))) {
    throw new HttpError('权限不存在或已停用', 409, 409);
  }
  return uniqueIds;
};
