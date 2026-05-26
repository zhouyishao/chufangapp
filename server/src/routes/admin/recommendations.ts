import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';
import { baseContentSchema, baseListQuerySchema, parseId } from './shared';

const upsertSchema = baseContentSchema.extend({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().nullable().optional(),
  cover: z.string().trim().max(255).nullable().optional(),
  targetType: z.enum(['NONE', 'URL', 'RECIPE', 'INGREDIENT', 'CATEGORY', 'MENU']).default('RECIPE'),
  targetUrl: z.string().trim().max(255).nullable().optional(),
  recipeId: z.coerce.number().int().nullable().optional(),
  ingredientId: z.coerce.number().int().nullable().optional(),
  categoryId: z.coerce.number().int().nullable().optional(),
  startAt: z.coerce.date().nullable().optional(),
  endAt: z.coerce.date().nullable().optional()
});

export const adminRecommendationsRouter = Router();

adminRecommendationsRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = baseListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status, isPublish, isRecommend } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(typeof isPublish === 'boolean' ? { isPublish } : {}),
    ...(typeof isRecommend === 'boolean' ? { isRecommend } : {}),
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {})
  };
  const [list, total] = await Promise.all([
    prisma.recommendation.findMany({
      where,
      include: {
        recipe: { select: { id: true, title: true, cover: true } },
        ingredient: { select: { id: true, name: true, cover: true } },
        category: { select: { id: true, name: true, type: true } }
      },
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize
    }),
    prisma.recommendation.count({ where })
  ]);
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminRecommendationsRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.recommendation.findFirst({ where: { id: parseId(req.params.id), deletedAt: null } });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(item));
});

adminRecommendationsRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.recommendation.create({ data: parsed.data })));
});

adminRecommendationsRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.recommendation.update({ where: { id: parseId(req.params.id) }, data: parsed.data })));
});

adminRecommendationsRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  res.json(ok(await prisma.recommendation.update({ where: { id: parseId(req.params.id) }, data: { deletedAt: new Date() } })));
});
