import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  isPublish: z.coerce.boolean().optional(),
  isRecommend: z.coerce.boolean().optional(),
  categoryId: z.coerce.number().int().optional()
});

const upsertSchema = z.object({
  name: z.string().trim().min(1).max(80),
  cover: z.string().trim().max(255).nullable().optional(),
  categoryId: z.coerce.number().int().nullable().optional(),
  seasonMonth: z.string().trim().max(64).nullable().optional(),
  nutrition: z.string().trim().nullable().optional(),
  selectionTips: z.string().trim().nullable().optional(),
  storageMethod: z.string().trim().nullable().optional(),
  taboo: z.string().trim().nullable().optional(),
  currentPrice: z.coerce.number().finite().nullable().optional(),
  priceUnit: z.string().trim().max(20).nullable().optional(),
  priceSource: z.string().trim().max(80).nullable().optional(),
  isPublish: z.coerce.boolean().default(true),
  isRecommend: z.coerce.boolean().default(false),
  sort: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE')
});

export const adminIngredientsRouter = Router();

adminIngredientsRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status, isPublish, isRecommend, categoryId } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(typeof isPublish === 'boolean' ? { isPublish } : {}),
    ...(typeof isRecommend === 'boolean' ? { isRecommend } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {})
  };

  const [list, total] = await Promise.all([
    prisma.ingredient.findMany({
      where,
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize,
      include: { category: { select: { id: true, name: true, type: true } } }
    }),
    prisma.ingredient.count({ where })
  ]);

  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminIngredientsRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const item = await prisma.ingredient.findFirst({
    where: { id, deletedAt: null },
    include: { category: { select: { id: true, name: true, type: true } } }
  });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(item));
});

adminIngredientsRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const created = await prisma.ingredient.create({ data: parsed.data });
  res.json(ok(created));
});

adminIngredientsRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const updated = await prisma.ingredient.update({ where: { id }, data: parsed.data });
  res.json(ok(updated));
});

adminIngredientsRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const existing = await prisma.ingredient.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);

  const deleted = await prisma.ingredient.update({ where: { id }, data: { deletedAt: new Date() } });
  res.json(ok(deleted));
});

adminIngredientsRouter.patch('/:id/publish', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const schema = z.object({ isPublish: z.coerce.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const updated = await prisma.ingredient.update({
    where: { id },
    data: { isPublish: parsed.data.isPublish }
  });
  res.json(ok(updated));
});

adminIngredientsRouter.patch('/:id/recommend', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const schema = z.object({ isRecommend: z.coerce.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const updated = await prisma.ingredient.update({
    where: { id },
    data: { isRecommend: parsed.data.isRecommend }
  });
  res.json(ok(updated));
});

adminIngredientsRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const schema = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const updated = await prisma.ingredient.update({
    where: { id },
    data: { status: parsed.data.status }
  });
  res.json(ok(updated));
});
