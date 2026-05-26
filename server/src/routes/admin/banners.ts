import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';
import { baseContentSchema, baseListQuerySchema, parseId } from './shared';

const upsertSchema = baseContentSchema.extend({
  title: z.string().trim().min(1).max(120),
  image: z.string().trim().min(1).max(255),
  targetType: z.enum(['NONE', 'URL', 'RECIPE', 'INGREDIENT', 'CATEGORY', 'MENU']).default('NONE'),
  targetUrl: z.string().trim().max(255).nullable().optional(),
  recipeId: z.coerce.number().int().nullable().optional()
});

export const adminBannersRouter = Router();

adminBannersRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = baseListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status, isPublish } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(typeof isPublish === 'boolean' ? { isPublish } : {}),
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {})
  };
  const [list, total] = await Promise.all([
    prisma.banner.findMany({
      where,
      include: { recipe: { select: { id: true, title: true, cover: true } } },
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize
    }),
    prisma.banner.count({ where })
  ]);
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminBannersRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.banner.findFirst({ where: { id: parseId(req.params.id), deletedAt: null } });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(item));
});

adminBannersRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.banner.create({ data: parsed.data })));
});

adminBannersRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.banner.update({ where: { id: parseId(req.params.id) }, data: parsed.data })));
});

adminBannersRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  res.json(ok(await prisma.banner.update({ where: { id: parseId(req.params.id) }, data: { deletedAt: new Date() } })));
});
