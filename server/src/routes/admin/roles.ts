import { Prisma } from '@prisma/client';
import { Router, type Request } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';
import { writeAdminOperationLog } from '../../services/admin-operation-log';
import { assertRoleMutationAllowed, validatePermissionReplacement } from '../../services/admin-rbac-guards';

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional()
});
const createSchema = z.object({
  code: z.string().trim().min(2).max(64).regex(/^[A-Z][A-Z0-9_]*$/),
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().max(255).nullable().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE')
});
const updateSchema = createSchema.omit({ code: true });

const roleInclude = {
  _count: { select: { admins: { where: { status: 'ACTIVE' as const, deletedAt: null } }, permissions: { where: { status: 'ACTIVE' as const, deletedAt: null } } } },
  permissions: { where: { status: 'ACTIVE' as const, deletedAt: null }, select: { permissionId: true } }
};
type RoleRow = Prisma.RoleGetPayload<{ include: typeof roleInclude }>;
const serializeRole = (role: RoleRow) => ({
  id: role.id,
  code: role.code,
  name: role.name,
  description: role.description,
  isSystem: role.isSystem,
  status: role.status,
  adminCount: role._count.admins,
  permissionCount: role.code === 'SUPER_ADMIN' ? null : role._count.permissions,
  permissionIds: role.permissions.map((item) => item.permissionId),
  updatedAt: role.updatedAt
});

const parseId = (value: string | undefined) => {
  const id = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);
  return id;
};
const actorId = (req: Request) => {
  const id = req.adminAccess?.admin.id;
  if (!id) throw new HttpError('unauthorized', 401, 401);
  return id;
};
const loadRole = async (tx: Prisma.TransactionClient, id: number) => {
  const role = await tx.role.findFirst({ where: { id, deletedAt: null }, include: roleInclude });
  if (!role) throw new HttpError('角色不存在', 404, 404);
  return role;
};

export const adminRolesRouter = Router();
export const adminPermissionsRouter = Router();

adminPermissionsRouter.get('/', async (_req, res) => {
  const rows = await prisma.permission.findMany({
    where: { status: 'ACTIVE', deletedAt: null },
    orderBy: [{ module: 'asc' }, { sort: 'asc' }, { id: 'asc' }],
    select: { id: true, key: true, name: true, module: true, action: true, sort: true, description: true }
  });
  const groups = Array.from(rows.reduce((map, permission) => {
    const group = map.get(permission.module) ?? { module: permission.module, moduleName: permission.description?.split(' · ')[0] ?? permission.module, permissions: [] as typeof rows };
    group.permissions.push(permission);
    map.set(permission.module, group);
    return map;
  }, new Map<string, { module: string; moduleName: string; permissions: typeof rows }>()).values());
  res.json(ok(groups));
});

adminRolesRouter.get('/', async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status } = parsed.data;
  const where: Prisma.RoleWhereInput = { deletedAt: null, ...(status ? { status } : {}), ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { code: { contains: q, mode: 'insensitive' } }] } : {}) };
  const [total, rows] = await Promise.all([
    prisma.role.count({ where }),
    prisma.role.findMany({ where, include: roleInclude, orderBy: [{ isSystem: 'desc' }, { sort: 'desc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize })
  ]);
  res.json(ok<PageResult<ReturnType<typeof serializeRole>>>({ list: rows.map(serializeRole), total, page, pageSize }));
});

adminRolesRouter.get('/:id', async (req, res) => {
  const row = await prisma.role.findFirst({ where: { id: parseId(req.params.id), deletedAt: null }, include: roleInclude });
  if (!row) throw new HttpError('角色不存在', 404, 404);
  res.json(ok(serializeRole(row)));
});

adminRolesRouter.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  try {
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.role.create({ data: { ...parsed.data, description: parsed.data.description ?? null }, include: roleInclude });
      await writeAdminOperationLog(tx, { adminId: actorId(req), module: '角色权限', action: '新增角色', method: 'POST', path: req.path, detail: { roleId: created.id, code: created.code } });
      return created;
    });
    res.json(ok(serializeRole(row)));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new HttpError('角色编码或名称已存在', 409, 409);
    throw error;
  }
});

adminRolesRouter.put('/:id', async (req, res) => {
  const roleId = parseId(req.params.id);
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const row = await prisma.$transaction(async (tx) => {
    const role = await loadRole(tx, roleId);
    if (parsed.data.status === 'DISABLED') assertRoleMutationAllowed({ isSystem: role.isSystem, code: role.code, adminCount: role._count.admins, mutation: 'DISABLE' });
    const updated = await tx.role.update({ where: { id: roleId }, data: { name: parsed.data.name, description: parsed.data.description ?? null, status: parsed.data.status }, include: roleInclude });
    await writeAdminOperationLog(tx, { adminId: actorId(req), module: '角色权限', action: '编辑角色', method: 'PUT', path: req.path, detail: { roleId, status: parsed.data.status } });
    return updated;
  });
  res.json(ok(serializeRole(row)));
});

adminRolesRouter.put('/:id/permissions', async (req, res) => {
  const roleId = parseId(req.params.id);
  const parsed = z.object({ permissionIds: z.array(z.coerce.number().int().positive()).max(500) }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const row = await prisma.$transaction(async (tx) => {
    const role = await loadRole(tx, roleId);
    assertRoleMutationAllowed({ isSystem: role.isSystem, code: role.code, adminCount: role._count.admins, mutation: 'REPLACE_PERMISSIONS' });
    const permissions = await tx.permission.findMany({ where: { id: { in: Array.from(new Set(parsed.data.permissionIds)) } }, select: { id: true, status: true, deletedAt: true } });
    const selectedIds = validatePermissionReplacement(parsed.data.permissionIds, permissions);
    await tx.rolePermission.updateMany({ where: { roleId, permissionId: { notIn: selectedIds }, deletedAt: null }, data: { status: 'DISABLED', deletedAt: new Date() } });
    for (const permissionId of selectedIds) {
      await tx.rolePermission.upsert({ where: { roleId_permissionId: { roleId, permissionId } }, create: { roleId, permissionId }, update: { status: 'ACTIVE', deletedAt: null } });
    }
    await writeAdminOperationLog(tx, { adminId: actorId(req), module: '角色权限', action: '配置权限', method: 'PUT', path: req.path, detail: { roleId, permissionIds: selectedIds } });
    return tx.role.findUniqueOrThrow({ where: { id: roleId }, include: roleInclude });
  });
  res.json(ok(serializeRole(row)));
});

adminRolesRouter.patch('/:id/status', async (req, res) => {
  const roleId = parseId(req.params.id);
  const parsed = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const row = await prisma.$transaction(async (tx) => {
    const role = await loadRole(tx, roleId);
    if (parsed.data.status === 'DISABLED') assertRoleMutationAllowed({ isSystem: role.isSystem, code: role.code, adminCount: role._count.admins, mutation: 'DISABLE' });
    const updated = await tx.role.update({ where: { id: roleId }, data: { status: parsed.data.status }, include: roleInclude });
    await writeAdminOperationLog(tx, { adminId: actorId(req), module: '角色权限', action: '变更角色状态', method: 'PATCH', path: req.path, detail: { roleId, status: parsed.data.status } });
    return updated;
  });
  res.json(ok(serializeRole(row)));
});

adminRolesRouter.delete('/:id', async (req, res) => {
  const roleId = parseId(req.params.id);
  await prisma.$transaction(async (tx) => {
    const role = await loadRole(tx, roleId);
    assertRoleMutationAllowed({ isSystem: role.isSystem, code: role.code, adminCount: role._count.admins, mutation: 'DELETE' });
    await tx.role.update({ where: { id: roleId }, data: { status: 'DISABLED', deletedAt: new Date() } });
    await writeAdminOperationLog(tx, { adminId: actorId(req), module: '角色权限', action: '删除角色', method: 'DELETE', path: req.path, detail: { roleId } });
  });
  res.json(ok({ id: roleId, deleted: true }));
});
