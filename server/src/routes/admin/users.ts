import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';
import { baseListQuerySchema, parseId } from './shared';

const upsertSchema = z.object({
  phone: z.string().trim().max(32).nullable().optional(),
  openid: z.string().trim().max(80).nullable().optional(),
  nickname: z.string().trim().max(60).nullable().optional(),
  avatar: z.string().trim().max(255).nullable().optional(),
  gender: z.string().trim().max(16).nullable().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE')
});

export const adminUsersRouter = Router();

adminUsersRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = baseListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(q ? { nickname: { contains: q, mode: 'insensitive' as const } } : {})
  };
  const [list, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: [{ id: 'desc' }], skip, take: pageSize }),
    prisma.user.count({ where })
  ]);
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminUsersRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.user.findFirst({ where: { id: parseId(req.params.id), deletedAt: null } });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(item));
});

adminUsersRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.user.create({ data: parsed.data })));
});

adminUsersRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.user.update({ where: { id: parseId(req.params.id) }, data: parsed.data })));
});

adminUsersRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  res.json(ok(await prisma.user.update({ where: { id: parseId(req.params.id) }, data: { deletedAt: new Date() } })));
});
