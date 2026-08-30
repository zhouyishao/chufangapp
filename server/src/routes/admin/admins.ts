import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { Router, type Request } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';
import { writeAdminOperationLog } from '../../services/admin-operation-log';
import { assertAdminMutationAllowed, type AdminMutation } from '../../services/admin-rbac-guards';

const passwordSchema = z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/\d/);
const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  roleId: z.coerce.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional()
});
const createSchema = z.object({
  username: z.string().trim().min(3).max(32),
  nickname: z.string().trim().min(1).max(32),
  password: passwordSchema,
  roleId: z.coerce.number().int().positive(),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE')
});
const updateSchema = z.object({
  nickname: z.string().trim().min(1).max(32),
  roleId: z.coerce.number().int().positive(),
  status: z.enum(['ACTIVE', 'DISABLED'])
});

const roleInclude = {
  roles: {
    where: { deletedAt: null, status: 'ACTIVE' as const },
    select: { role: { select: { id: true, code: true, name: true, isSystem: true } } }
  }
};

type AdminRow = Prisma.AdminGetPayload<{ include: typeof roleInclude }>;
const serializeAdmin = (admin: AdminRow) => ({
  id: admin.id,
  username: admin.username,
  nickname: admin.nickname,
  status: admin.status,
  lastLoginAt: admin.lastLoginAt,
  createdAt: admin.createdAt,
  role: admin.roles[0]?.role ?? null
});

const parseId = (value: string | undefined) => {
  const id = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);
  return id;
};

const activeRole = async (tx: Prisma.TransactionClient, roleId: number) => {
  const role = await tx.role.findFirst({ where: { id: roleId, status: 'ACTIVE', deletedAt: null } });
  if (!role) throw new HttpError('角色不存在或已停用', 409, 409);
  return role;
};

const protectMutation = async (tx: Prisma.TransactionClient, actorId: number, targetId: number, mutation: AdminMutation) => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(84321, 1)`;
  const target = await tx.admin.findFirst({ where: { id: targetId, deletedAt: null }, include: roleInclude });
  if (!target) throw new HttpError('管理员不存在', 404, 404);
  const targetIsSuperAdmin = target.roles[0]?.role.code === 'SUPER_ADMIN';
  const activeSuperAdminCount = await tx.admin.count({
    where: {
      status: 'ACTIVE', deletedAt: null,
      roles: { some: { status: 'ACTIVE', deletedAt: null, role: { code: 'SUPER_ADMIN', status: 'ACTIVE', deletedAt: null } } }
    }
  });
  assertAdminMutationAllowed({ actorId, targetId, mutation, targetIsSuperAdmin, activeSuperAdminCount });
  return target;
};

const actorId = (req: Request) => {
  const id = req.adminAccess?.admin.id;
  if (!id) throw new HttpError('unauthorized', 401, 401);
  return id;
};

export const adminAdminsRouter = Router();

adminAdminsRouter.get('/', async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, roleId, status } = parsed.data;
  const where: Prisma.AdminWhereInput = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ username: { contains: q, mode: 'insensitive' } }, { nickname: { contains: q, mode: 'insensitive' } }] } : {}),
    ...(roleId ? { roles: { some: { roleId, status: 'ACTIVE', deletedAt: null } } } : {})
  };
  const [total, rows] = await Promise.all([
    prisma.admin.count({ where }),
    prisma.admin.findMany({ where, include: roleInclude, orderBy: [{ sort: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize })
  ]);
  res.json(ok<PageResult<ReturnType<typeof serializeAdmin>>>({ list: rows.map(serializeAdmin), total, page, pageSize }));
});

adminAdminsRouter.get('/:id', async (req, res) => {
  const row = await prisma.admin.findFirst({ where: { id: parseId(req.params.id), deletedAt: null }, include: roleInclude });
  if (!row) throw new HttpError('管理员不存在', 404, 404);
  res.json(ok(serializeAdmin(row)));
});

adminAdminsRouter.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const operatorId = actorId(req);
  try {
    const row = await prisma.$transaction(async (tx) => {
      await activeRole(tx, parsed.data.roleId);
      const created = await tx.admin.create({
        data: { username: parsed.data.username, nickname: parsed.data.nickname, passwordHash: await bcrypt.hash(parsed.data.password, 10), status: parsed.data.status, roles: { create: { roleId: parsed.data.roleId } } },
        include: roleInclude
      });
      await writeAdminOperationLog(tx, { adminId: operatorId, module: '管理员管理', action: '新增管理员', method: 'POST', path: req.path, detail: { targetAdminId: created.id, roleId: parsed.data.roleId, status: parsed.data.status } });
      return created;
    });
    res.json(ok(serializeAdmin(row)));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new HttpError('管理员账号已存在', 409, 409);
    throw error;
  }
});

adminAdminsRouter.put('/:id', async (req, res) => {
  const targetId = parseId(req.params.id);
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const operatorId = actorId(req);
  const row = await prisma.$transaction(async (tx) => {
    const role = await activeRole(tx, parsed.data.roleId);
    const target = parsed.data.status === 'DISABLED'
      ? await protectMutation(tx, operatorId, targetId, 'DISABLE')
      : await tx.admin.findFirst({ where: { id: targetId, deletedAt: null }, include: roleInclude });
    if (!target) throw new HttpError('管理员不存在', 404, 404);
    const currentRoleId = target.roles[0]?.role.id;
    if (currentRoleId !== role.id && target.roles[0]?.role.code === 'SUPER_ADMIN' && role.code !== 'SUPER_ADMIN') {
      await protectMutation(tx, operatorId, targetId, 'CHANGE_ROLE');
    }
    await tx.adminRole.updateMany({ where: { adminId: targetId, deletedAt: null }, data: { status: 'DISABLED', deletedAt: new Date() } });
    await tx.adminRole.upsert({ where: { adminId_roleId: { adminId: targetId, roleId: role.id } }, create: { adminId: targetId, roleId: role.id }, update: { status: 'ACTIVE', deletedAt: null } });
    const updated = await tx.admin.update({ where: { id: targetId }, data: { nickname: parsed.data.nickname, status: parsed.data.status }, include: roleInclude });
    await writeAdminOperationLog(tx, { adminId: operatorId, module: '管理员管理', action: '编辑管理员', method: 'PUT', path: req.path, detail: { targetAdminId: targetId, roleId: role.id, status: parsed.data.status } });
    return updated;
  });
  res.json(ok(serializeAdmin(row)));
});

adminAdminsRouter.put('/:id/password', async (req, res) => {
  const targetId = parseId(req.params.id);
  const parsed = z.object({ password: passwordSchema }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('密码至少 8 位且必须包含字母和数字', 400, 400);
  const operatorId = actorId(req);
  await prisma.$transaction(async (tx) => {
    const exists = await tx.admin.findFirst({ where: { id: targetId, deletedAt: null }, select: { id: true } });
    if (!exists) throw new HttpError('管理员不存在', 404, 404);
    await tx.admin.update({ where: { id: targetId }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 10) } });
    await writeAdminOperationLog(tx, { adminId: operatorId, module: '管理员管理', action: '重置密码', method: 'PUT', path: req.path, detail: { targetAdminId: targetId, passwordReset: true } });
  });
  res.json(ok({ id: targetId, passwordReset: true }));
});

adminAdminsRouter.patch('/:id/status', async (req, res) => {
  const targetId = parseId(req.params.id);
  const parsed = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const operatorId = actorId(req);
  const row = await prisma.$transaction(async (tx) => {
    if (parsed.data.status === 'DISABLED') {
      await protectMutation(tx, operatorId, targetId, 'DISABLE');
    } else {
      const exists = await tx.admin.findFirst({ where: { id: targetId, deletedAt: null }, select: { id: true } });
      if (!exists) throw new HttpError('管理员不存在', 404, 404);
    }
    const updated = await tx.admin.update({ where: { id: targetId }, data: { status: parsed.data.status }, include: roleInclude });
    await writeAdminOperationLog(tx, { adminId: operatorId, module: '管理员管理', action: '变更状态', method: 'PATCH', path: req.path, detail: { targetAdminId: targetId, status: parsed.data.status } });
    return updated;
  });
  res.json(ok(serializeAdmin(row)));
});

adminAdminsRouter.delete('/:id', async (req, res) => {
  const targetId = parseId(req.params.id);
  const operatorId = actorId(req);
  await prisma.$transaction(async (tx) => {
    await protectMutation(tx, operatorId, targetId, 'DELETE');
    await tx.admin.update({ where: { id: targetId }, data: { status: 'DISABLED', deletedAt: new Date() } });
    await writeAdminOperationLog(tx, { adminId: operatorId, module: '管理员管理', action: '删除管理员', method: 'DELETE', path: req.path, detail: { targetAdminId: targetId } });
  });
  res.json(ok({ id: targetId, deleted: true }));
});
