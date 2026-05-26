import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';
import { baseContentSchema, baseListQuerySchema, parseId } from './shared';

const listQuerySchema = baseListQuerySchema.extend({
  month: z.coerce.number().int().min(1).max(12).optional()
});

const upsertSchema = baseContentSchema.extend({
  ingredientId: z.coerce.number().int().nullable().optional(),
  name: z.string().trim().min(1).max(80),
  month: z.coerce.number().int().min(1).max(12),
  cover: z.string().trim().max(255).nullable().optional(),
  reason: z.string().trim().nullable().optional()
});

export const adminSeasonalFoodsRouter = Router();

adminSeasonalFoodsRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status, isPublish, isRecommend, month } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(typeof isPublish === 'boolean' ? { isPublish } : {}),
    ...(typeof isRecommend === 'boolean' ? { isRecommend } : {}),
    ...(month ? { month } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {})
  };
  const [list, total] = await Promise.all([
    prisma.seasonalFood.findMany({
      where,
      include: { ingredient: { select: { id: true, name: true, cover: true } } },
      orderBy: [{ month: 'asc' }, { sort: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize
    }),
    prisma.seasonalFood.count({ where })
  ]);
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminSeasonalFoodsRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.seasonalFood.findFirst({
    where: { id: parseId(req.params.id), deletedAt: null },
    include: { ingredient: { select: { id: true, name: true, cover: true } } }
  });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(item));
});

adminSeasonalFoodsRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.seasonalFood.create({ data: parsed.data })));
});

adminSeasonalFoodsRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.seasonalFood.update({ where: { id: parseId(req.params.id) }, data: parsed.data })));
});

adminSeasonalFoodsRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  res.json(ok(await prisma.seasonalFood.update({ where: { id: parseId(req.params.id) }, data: { deletedAt: new Date() } })));
});
