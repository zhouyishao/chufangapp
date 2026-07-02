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
  type: z.enum(['RECIPE', 'INGREDIENT', 'SEASONING', 'FRUIT', 'COCKTAIL', 'BEVERAGE']).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional()
});

const upsertSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(['RECIPE', 'INGREDIENT', 'SEASONING', 'FRUIT', 'COCKTAIL', 'BEVERAGE']).default('INGREDIENT'),
  sort: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
  isPublish: z.coerce.boolean().default(true)
});

export const adminCategoriesRouter = Router();

const serializeCategory = <T extends { id: number; bizId?: string | null; code?: string | null; sort?: number; sortOrder?: number }>(item: T) => ({
  ...item,
  legacyId: item.id,
  id: getPublicId('category', item),
  code: getPublicCode('category', item),
  sortOrder: item.sortOrder ?? item.sort ?? 0
});

adminCategoriesRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, type, status } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {})
  };

  const [list, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize,
      select: {
        id: true,
        bizId: true,
        code: true,
        type: true,
        name: true,
        sort: true,
        sortOrder: true,
        status: true,
        isPublish: true,
        isRecommend: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.category.count({ where })
  ]);

  // 批量统计每个分类的关联内容数量
  const categoryIds = list.map(c => c.id);
  const [recipeCounts, ingredientCounts, beverageCounts] = await Promise.all([
    prisma.recipe.groupBy({
      by: ['categoryId'],
      where: { categoryId: { in: categoryIds }, deletedAt: null },
      _count: { id: true }
    }),
    prisma.ingredient.groupBy({
      by: ['categoryId'],
      where: { categoryId: { in: categoryIds }, deletedAt: null },
      _count: { id: true }
    }),
    prisma.beverage.groupBy({
      by: ['categoryId'],
      where: { categoryId: { in: categoryIds }, deletedAt: null },
      _count: { id: true }
    })
  ]);

  const relatedCountMap = new Map<number, number>();
  for (const row of recipeCounts) {
    if (row.categoryId !== null) {
      relatedCountMap.set(row.categoryId, (relatedCountMap.get(row.categoryId) ?? 0) + row._count.id);
    }
  }
  for (const row of ingredientCounts) {
    if (row.categoryId !== null) {
      relatedCountMap.set(row.categoryId, (relatedCountMap.get(row.categoryId) ?? 0) + row._count.id);
    }
  }
  for (const row of beverageCounts) {
    if (row.categoryId !== null) {
      relatedCountMap.set(row.categoryId, (relatedCountMap.get(row.categoryId) ?? 0) + row._count.id);
    }
  }

  const data: PageResult<ReturnType<typeof serializeCategory> & { relatedCount: number }> = {
    list: list.map(item => ({ ...serializeCategory(item), relatedCount: relatedCountMap.get(item.id) ?? 0 })),
    total,
    page,
    pageSize
  };
  res.json(ok(data));
});

adminCategoriesRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.category.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(serializeCategory(item)));
});

adminCategoriesRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const codes = await prisma.category.findMany({ select: { code: true } });
  const created = await prisma.category.create({
    data: {
      ...parsed.data,
      bizId: createBusinessId('category'),
      code: nextCodeFromItems('category', codes),
      sortOrder: parsed.data.sort
    }
  });
  res.json(ok(serializeCategory(created)));
});

adminCategoriesRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await prisma.category.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);

  const updated = await prisma.category.update({
    where: { id: existing.id },
    data: { ...parsed.data, sortOrder: parsed.data.sort }
  });
  res.json(ok(serializeCategory(updated)));
});

adminCategoriesRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  const existing = await prisma.category.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);
  const id = existing.id;

  const [recipeCount, ingredientCount] = await Promise.all([
    prisma.recipe.count({ where: { categoryId: id, deletedAt: null } }),
    prisma.ingredient.count({ where: { categoryId: id, deletedAt: null } })
  ]);
  if (recipeCount + ingredientCount > 0) {
    throw new HttpError('该分类已被内容引用，不能删除', 422, 422);
  }

  const deleted = await prisma.category.update({
    where: { id },
    data: { deletedAt: new Date(), isDeleted: true }
  });
  res.json(ok(serializeCategory(deleted)));
});

adminCategoriesRouter.patch('/:id/publish', requireAdminAuth, async (req, res) => {
  const schema = z.object({ isPublish: z.coerce.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await prisma.category.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);

  const updated = await prisma.category.update({
    where: { id: existing.id },
    data: { isPublish: parsed.data.isPublish }
  });
  res.json(ok(serializeCategory(updated)));
});

adminCategoriesRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const schema = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await prisma.category.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);

  const updated = await prisma.category.update({
    where: { id: existing.id },
    data: { status: parsed.data.status }
  });
  res.json(ok(serializeCategory(updated)));
});
