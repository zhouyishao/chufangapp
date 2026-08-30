import { prisma } from '../prisma';

type PermissionRelationInput = {
  permission: {
    key: string;
    status: 'ACTIVE' | 'DISABLED';
    deletedAt: Date | null;
  };
};

type RoleRelationInput = {
  role: {
    id: number;
    code: string;
    name: string;
    isSystem: boolean;
    status: 'ACTIVE' | 'DISABLED';
    deletedAt: Date | null;
    permissions: PermissionRelationInput[];
  };
};

export type AdminAccessInput = {
  id: number;
  username: string;
  nickname: string | null;
  lastLoginAt: Date | null;
  roles: RoleRelationInput[];
};

export type AdminAccessContext = {
  admin: {
    id: number;
    username: string;
    nickname: string | null;
    lastLoginAt: Date | null;
  };
  role: {
    id: number;
    code: string;
    name: string;
    isSystem: boolean;
  };
  permissions: string[];
};

export const serializeAdminAccess = (input: AdminAccessInput): AdminAccessContext | null => {
  if (input.roles.length !== 1) return null;
  const role = input.roles[0]?.role;
  if (!role || role.status !== 'ACTIVE' || role.deletedAt) return null;

  const permissions = role.code === 'SUPER_ADMIN'
    ? ['*']
    : Array.from(
        new Set(
          role.permissions
            .filter(({ permission }) => permission.status === 'ACTIVE' && !permission.deletedAt)
            .map(({ permission }) => permission.key)
        )
      ).sort();

  return {
    admin: {
      id: input.id,
      username: input.username,
      nickname: input.nickname,
      lastLoginAt: input.lastLoginAt
    },
    role: {
      id: role.id,
      code: role.code,
      name: role.name,
      isSystem: role.isSystem
    },
    permissions
  };
};

export const loadAdminAccess = async (adminId: number): Promise<AdminAccessContext | null> => {
  const admin = await prisma.admin.findFirst({
    where: { id: adminId, deletedAt: null, status: 'ACTIVE' },
    select: {
      id: true,
      username: true,
      nickname: true,
      lastLoginAt: true,
      roles: {
        where: { deletedAt: null, status: 'ACTIVE' },
        select: {
          role: {
            select: {
              id: true,
              code: true,
              name: true,
              isSystem: true,
              status: true,
              deletedAt: true,
              permissions: {
                where: { deletedAt: null, status: 'ACTIVE' },
                select: {
                  permission: {
                    select: { key: true, status: true, deletedAt: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return admin ? serializeAdminAccess(admin) : null;
};
