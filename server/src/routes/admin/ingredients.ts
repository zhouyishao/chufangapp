import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { buildPublicIdWhere, createBusinessId, getPublicCode, getPublicId, nextCodeFromItems } from '../../lib/business-id';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  isPublish: z.coerce.boolean().optional(),
  isRecommend: z.coerce.boolean().optional(),
  categoryId: z.string().trim().optional()
});

const upsertSchema = z.object({
  name: z.string().trim().min(1).max(80),
  cover: z.string().trim().max(255).nullable().optional(),
  categoryId: z.union([z.coerce.number().int(), z.string().trim()]).nullable().optional(),
  seasonMonth: z.string().trim().max(64).nullable().optional(),
  nutrition: z.string().trim().nullable().optional(),
  selectionTips: z.string().trim().nullable().optional(),
  storageMethod: z.string().trim().nullable().optional(),
  taboo: z.string().trim().nullable().optional(),
  detailImages: z.array(z.string().trim().max(255)).default([]),
  selectionMedia: z.string().trim().max(255).nullable().optional(),
  currentPrice: z.coerce.number().finite().nullable().optional(),
  priceUnit: z.string().trim().max(20).nullable().optional(),
  priceSource: z.string().trim().max(80).nullable().optional(),
  isPublish: z.coerce.boolean().default(true),
  isRecommend: z.coerce.boolean().default(false),
  sort: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE')
});

export const adminIngredientsRouter = Router();

const serializeCategory = (category: { id: number; bizId?: string | null; code?: string | null; type: unknown; name: string } | null) =>
  category
    ? {
        ...category,
        legacyId: category.id,
        id: getPublicId('category', category),
        code: getPublicCode('category', category)
      }
    : null;

const serializeIngredient = <
  T extends { id: number; bizId?: string | null; code?: string | null; sort?: number; sortOrder?: number; category?: { id: number; bizId?: string | null; code?: string | null; type: unknown; name: string } | null }
>(item: T) => ({
  ...item,
  legacyId: item.id,
  id: getPublicId('ingredient', item),
  code: getPublicCode('ingredient', item),
  sortOrder: item.sortOrder ?? item.sort ?? 0,
  category: serializeCategory(item.category ?? null),
  categoryId: item.category ? getPublicId('category', item.category) : null
});

const resolveCategoryId = async (value: number | string | null | undefined) => {
  if (value === undefined || value === null || value === '') return null;
  const item = await prisma.category.findFirst({ where: { ...buildPublicIdWhere(value), deletedAt: null } });
  if (!item) throw new HttpError('分类不存在', 422, 422);
  return item.id;
};

adminIngredientsRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status, isPublish, isRecommend } = parsed.data;
  const categoryId = await resolveCategoryId(parsed.data.categoryId);
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
      include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
    }),
    prisma.ingredient.count({ where })
  ]);

  const data: PageResult<ReturnType<typeof serializeIngredient>> = { list: list.map(serializeIngredient), total, page, pageSize };
  res.json(ok(data));
});

adminIngredientsRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.ingredient.findFirst({
    where: { ...buildPublicIdWhere(req.params.id), deletedAt: null },
    include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
  });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(serializeIngredient(item)));
});

adminIngredientsRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const categoryId = await resolveCategoryId(parsed.data.categoryId);
  const { categoryId: _categoryId, ...payload } = parsed.data;
  const codes = await prisma.ingredient.findMany({ select: { code: true } });
  const created = await prisma.ingredient.create({
    data: {
      ...payload,
      categoryId,
      bizId: createBusinessId('ingredient'),
      code: nextCodeFromItems('ingredient', codes),
      sortOrder: parsed.data.sort
    },
    include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
  });
  res.json(ok(serializeIngredient(created)));
});

adminIngredientsRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await prisma.ingredient.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);
  const categoryId = await resolveCategoryId(parsed.data.categoryId);
  const { categoryId: _categoryId, ...payload } = parsed.data;

  const updated = await prisma.ingredient.update({
    where: { id: existing.id },
    data: { ...payload, categoryId, sortOrder: parsed.data.sort },
    include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
  });
  res.json(ok(serializeIngredient(updated)));
});

adminIngredientsRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  const existing = await prisma.ingredient.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);

  const deleted = await prisma.ingredient.update({
    where: { id: existing.id },
    data: { deletedAt: new Date(), isDeleted: true },
    include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
  });
  res.json(ok(serializeIngredient(deleted)));
});

adminIngredientsRouter.patch('/:id/publish', requireAdminAuth, async (req, res) => {
  const schema = z.object({ isPublish: z.coerce.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await prisma.ingredient.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);

  const updated = await prisma.ingredient.update({
    where: { id: existing.id },
    data: { isPublish: parsed.data.isPublish },
    include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
  });
  res.json(ok(serializeIngredient(updated)));
});

adminIngredientsRouter.patch('/:id/recommend', requireAdminAuth, async (req, res) => {
  const schema = z.object({ isRecommend: z.coerce.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await prisma.ingredient.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);

  const updated = await prisma.ingredient.update({
    where: { id: existing.id },
    data: { isRecommend: parsed.data.isRecommend },
    include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
  });
  res.json(ok(serializeIngredient(updated)));
});

adminIngredientsRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const schema = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await prisma.ingredient.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);

  const updated = await prisma.ingredient.update({
    where: { id: existing.id },
    data: { status: parsed.data.status },
    include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
  });
  res.json(ok(serializeIngredient(updated)));
});
