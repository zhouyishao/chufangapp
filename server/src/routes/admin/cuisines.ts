import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';
import { baseContentSchema, baseListQuerySchema, parseId } from './shared';

const upsertSchema = baseContentSchema.extend({
  name: z.string().trim().min(1).max(80),
  cover: z.string().trim().max(255).nullable().optional(),
  description: z.string().trim().nullable().optional()
});

export const adminCuisinesRouter = Router();

adminCuisinesRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = baseListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status, isPublish, isRecommend } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(typeof isPublish === 'boolean' ? { isPublish } : {}),
    ...(typeof isRecommend === 'boolean' ? { isRecommend } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {})
  };
  const [list, total] = await Promise.all([
    prisma.cuisine.findMany({ where, orderBy: [{ sort: 'desc' }, { id: 'desc' }], skip, take: pageSize }),
    prisma.cuisine.count({ where })
  ]);
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminCuisinesRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.cuisine.findFirst({ where: { id: parseId(req.params.id), deletedAt: null } });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(item));
});

adminCuisinesRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.cuisine.create({ data: parsed.data })));
});

adminCuisinesRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.cuisine.update({ where: { id: parseId(req.params.id) }, data: parsed.data })));
});

adminCuisinesRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  res.json(ok(await prisma.cuisine.update({ where: { id: parseId(req.params.id) }, data: { deletedAt: new Date() } })));
});
