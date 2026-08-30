import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { buildPublicIdWhere, createBusinessId, getPublicCode, getPublicId, nextCodeFromItems } from '../../lib/business-id';
import { buildCategoryMetrics, type CategoryMetric } from '../../services/admin-category-metrics';

const categoryTypeSchema = z.enum(['RECIPE', 'INGREDIENT', 'SEASONING', 'FRUIT', 'COCKTAIL', 'BEVERAGE']);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  type: categoryTypeSchema.optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  level: z.coerce.number().int().min(1).max(2).optional(),
  isPublish: z.enum(['true', 'false']).transform((value) => value === 'true').optional()
});

const upsertSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: categoryTypeSchema.default('INGREDIENT'),
  parentId: z.union([z.coerce.number().int().positive(), z.string().trim().min(1)]).nullable().optional(),
  sort: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
  isPublish: z.coerce.boolean().default(true)
});

export const adminCategoriesRouter = Router();

const serializeCategory = <T extends { id: number; bizId?: string | null; code?: string | null; sort?: number; sortOrder?: number; parentId?: number | null; parent?: { id: number; bizId?: string | null; code?: string | null; name: string } | null }>(item: T) => ({
  ...item,
  legacyId: item.id,
  id: getPublicId('category', item),
  code: getPublicCode('category', item),
  sortOrder: item.sortOrder ?? item.sort ?? 0,
  parentId: item.parent ? getPublicId('category', item.parent) : null,
  parent: item.parent ? {
    id: getPublicId('category', item.parent),
    legacyId: item.parent.id,
    name: item.parent.name
  } : null
});

const resolveParentId = async (
  rawParentId: string | number | null | undefined,
  type: z.infer<typeof upsertSchema>['type'],
  currentId?: number
) => {
  if (rawParentId == null || rawParentId === '') return null;
  const parent = await prisma.category.findFirst({
    where: { ...buildPublicIdWhere(String(rawParentId)), deletedAt: null }
  });
  if (!parent) throw new HttpError('上级分类不存在', 422, 422);
  if (parent.type !== type) throw new HttpError('上级分类必须与当前分类类型一致', 422, 422);
  if (parent.parentId != null) throw new HttpError('分类最多支持两级', 422, 422);
  if (currentId && parent.id === currentId) throw new HttpError('不能选择自身或下级分类作为上级分类', 422, 422);

  if (currentId) {
    const childCount = await prisma.category.count({ where: { parentId: currentId, deletedAt: null } });
    if (childCount > 0) throw new HttpError('分类最多支持两级', 422, 422);
  }

  if (currentId) {
    let cursor: typeof parent | null = parent;
    const visited = new Set<number>();
    while (cursor?.parentId && !visited.has(cursor.id)) {
      visited.add(cursor.id);
      if (cursor.parentId === currentId) throw new HttpError('不能选择自身或下级分类作为上级分类', 422, 422);
      cursor = await prisma.category.findFirst({ where: { id: cursor.parentId, deletedAt: null } });
    }
  }
  return parent.id;
};

const groupCountMap = (rows: Array<{ categoryId: number | null; _count: { id: number } }>) => new Map(
  rows.flatMap((row) => row.categoryId == null ? [] : [[row.categoryId, row._count.id] as const]),
);

const categoryReferenceCounts = async (categoryId: number) => {
  const [recipeCount, ingredientCount, beverageCount, childCount] = await Promise.all([
    prisma.recipe.count({ where: { categoryId, deletedAt: null } }),
    prisma.ingredient.count({ where: { categoryId, deletedAt: null } }),
    prisma.beverage.count({ where: { categoryId, deletedAt: null } }),
    prisma.category.count({ where: { parentId: categoryId, deletedAt: null } }),
  ]);
  return { recipeCount, ingredientCount, beverageCount, childCount };
};

const hasCategoryReferences = (counts: Awaited<ReturnType<typeof categoryReferenceCounts>>) => (
  counts.recipeCount + counts.ingredientCount + counts.beverageCount + counts.childCount > 0
);

adminCategoriesRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, type, status, level, isPublish } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(isPublish === undefined ? {} : { isPublish }),
    ...(level === 1 ? { parentId: null } : {}),
    ...(level === 2 ? { parentId: { not: null } } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {})
  };

  const [list, summaryRows, allCategoryNodes, recipeCounts, publicRecipeCounts, ingredientCounts, publicIngredientCounts, beverageCounts, publicBeverageCounts] = await Promise.all([
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
        parentId: true,
        parent: { select: { id: true, bizId: true, code: true, name: true } },
        sort: true,
        sortOrder: true,
        status: true,
        isPublish: true,
        isRecommend: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.category.findMany({
      where,
      select: { id: true, parentId: true, status: true, isPublish: true },
    }),
    prisma.category.findMany({
      where: { deletedAt: null },
      select: { id: true, type: true, parentId: true },
    }),
    prisma.recipe.groupBy({
      by: ['categoryId'],
      where: { deletedAt: null },
      _count: { id: true }
    }),
    prisma.recipe.groupBy({
      by: ['categoryId'],
      where: { deletedAt: null, status: 'ACTIVE', isPublish: true, auditStatus: 'APPROVED' },
      _count: { id: true }
    }),
    prisma.ingredient.groupBy({
      by: ['categoryId'],
      where: { deletedAt: null },
      _count: { id: true }
    }),
    prisma.ingredient.groupBy({
      by: ['categoryId'],
      where: { deletedAt: null, status: 'ACTIVE', isPublish: true },
      _count: { id: true }
    }),
    prisma.beverage.groupBy({
      by: ['categoryId'],
      where: { deletedAt: null },
      _count: { id: true }
    }),
    prisma.beverage.groupBy({
      by: ['categoryId'],
      where: { deletedAt: null, status: 'ACTIVE', isPublish: true },
      _count: { id: true }
    })
  ]);

  const totalMaps = {
    RECIPE: groupCountMap(recipeCounts),
    INGREDIENT: groupCountMap(ingredientCounts),
    FRUIT: groupCountMap(ingredientCounts),
    SEASONING: groupCountMap(ingredientCounts),
    COCKTAIL: groupCountMap(beverageCounts),
    BEVERAGE: groupCountMap(beverageCounts),
  };
  const publicMaps = {
    RECIPE: groupCountMap(publicRecipeCounts),
    INGREDIENT: groupCountMap(publicIngredientCounts),
    FRUIT: groupCountMap(publicIngredientCounts),
    SEASONING: groupCountMap(publicIngredientCounts),
    COCKTAIL: groupCountMap(publicBeverageCounts),
    BEVERAGE: groupCountMap(publicBeverageCounts),
  };
  const metricById = new Map<number, CategoryMetric>();
  for (const categoryType of categoryTypeSchema.options) {
    const nodes = allCategoryNodes.filter((node) => node.type === categoryType);
    for (const [id, metric] of buildCategoryMetrics(nodes, totalMaps[categoryType], publicMaps[categoryType])) {
      metricById.set(id, metric);
    }
  }

  const summary = {
    total: summaryRows.length,
    firstLevel: summaryRows.filter((item) => item.parentId == null).length,
    secondLevel: summaryRows.filter((item) => item.parentId != null).length,
    active: summaryRows.filter((item) => item.status === 'ACTIVE').length,
    disabled: summaryRows.filter((item) => item.status === 'DISABLED').length,
    published: summaryRows.filter((item) => item.isPublish).length,
    hidden: summaryRows.filter((item) => !item.isPublish).length,
    emptyPublic: summaryRows.filter((item) => (metricById.get(item.id)?.publicContentCount ?? 0) === 0).length,
  };

  const data: PageResult<ReturnType<typeof serializeCategory> & CategoryMetric & { relatedCount: number; canChangeType: boolean }> & { summary: typeof summary } = {
    list: list.map((item) => {
      const metric = metricById.get(item.id) ?? {
        level: item.parentId == null ? 1 : 2,
        childCount: 0,
        directContentCount: 0,
        descendantContentCount: 0,
        publicContentCount: 0,
      };
      return {
        ...serializeCategory(item),
        ...metric,
        relatedCount: metric.directContentCount,
        canChangeType: metric.descendantContentCount === 0 && metric.childCount === 0,
      };
    }),
    total: summaryRows.length,
    page,
    pageSize,
    summary,
  };
  res.json(ok(data));
});

adminCategoriesRouter.patch('/reorder', requireAdminAuth, async (req, res) => {
  const schema = z.object({
    type: categoryTypeSchema,
    parentId: z.union([z.coerce.number().int().positive(), z.string().trim().min(1)]).nullable(),
    orderedIds: z.array(z.union([z.coerce.number().int().positive(), z.string().trim().min(1)])).min(1).max(100),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  if (new Set(parsed.data.orderedIds.map(String)).size !== parsed.data.orderedIds.length) {
    throw new HttpError('分类排序 ID 不能重复', 422, 422);
  }

  const parent = parsed.data.parentId == null ? null : await prisma.category.findFirst({
    where: { ...buildPublicIdWhere(String(parsed.data.parentId)), deletedAt: null },
  });
  if (parsed.data.parentId != null && (!parent || parent.type !== parsed.data.type)) {
    throw new HttpError('分类排序范围不一致', 409, 409);
  }
  const parentId = parent?.id ?? null;

  const resolved = await Promise.all(parsed.data.orderedIds.map((id) => prisma.category.findFirst({
    where: { ...buildPublicIdWhere(String(id)), deletedAt: null },
  })));
  if (resolved.some((item) => !item)) throw new HttpError('分类不存在', 422, 422);

  const resolvedCategories = resolved.filter((item): item is NonNullable<typeof item> => item != null);
  const resolvedIds = resolvedCategories.map((item) => item.id);
  if (new Set(resolvedIds).size !== resolvedIds.length) {
    throw new HttpError('分类排序 ID 不能重复', 422, 422);
  }
  if (resolvedCategories.some((item) => item.type !== parsed.data.type || item.parentId !== parentId)) {
    throw new HttpError('分类排序范围不一致', 409, 409);
  }

  const siblings = await prisma.category.findMany({
    where: { type: parsed.data.type, parentId, deletedAt: null },
    select: { id: true },
  });
  const expectedIds = siblings.map((item) => item.id).sort((left, right) => left - right);
  const actualIds = [...resolvedIds].sort((left, right) => left - right);
  if (expectedIds.length !== actualIds.length || expectedIds.some((id, index) => id !== actualIds[index])) {
    throw new HttpError('排序列表必须包含同级全部分类', 409, 409);
  }

  await prisma.$transaction(resolvedIds.map((id, index) => {
    const sort = resolvedIds.length - index;
    return prisma.category.update({ where: { id }, data: { sort, sortOrder: sort } });
  }));

  const updated = await prisma.category.findMany({
    where: { id: { in: resolvedIds } },
    include: { parent: { select: { id: true, bizId: true, code: true, name: true } } },
  });
  const updatedById = new Map(updated.map((item) => [item.id, item]));
  res.json(ok(resolvedIds.flatMap((id) => {
    const item = updatedById.get(id);
    return item ? [serializeCategory(item)] : [];
  })));
});

adminCategoriesRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.category.findFirst({
    where: { ...buildPublicIdWhere(req.params.id), deletedAt: null },
    include: { parent: { select: { id: true, bizId: true, code: true, name: true } } }
  });
  if (!item) throw new HttpError('not found', 404, 404);
  const references = await categoryReferenceCounts(item.id);
  res.json(ok({
    ...serializeCategory(item),
    level: item.parentId == null ? 1 : 2,
    childCount: references.childCount,
    directContentCount: references.recipeCount + references.ingredientCount + references.beverageCount,
    canChangeType: !hasCategoryReferences(references),
  }));
});

adminCategoriesRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const parentId = await resolveParentId(parsed.data.parentId, parsed.data.type);
  const { parentId: _parentId, ...payload } = parsed.data;
  const codes = await prisma.category.findMany({ select: { code: true } });
  const created = await prisma.category.create({
    data: {
      ...payload,
      parentId,
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
  if (parsed.data.type !== existing.type) {
    const references = await categoryReferenceCounts(existing.id);
    if (hasCategoryReferences(references)) {
      throw new HttpError('已有内容或子分类，不能修改分类类型', 422, 422);
    }
  }
  const parentId = await resolveParentId(parsed.data.parentId, parsed.data.type, existing.id);
  const { parentId: _parentId, ...payload } = parsed.data;

  const updated = await prisma.category.update({
    where: { id: existing.id },
    data: { ...payload, parentId, sortOrder: parsed.data.sort },
    include: { parent: { select: { id: true, bizId: true, code: true, name: true } } }
  });
  res.json(ok(serializeCategory(updated)));
});

adminCategoriesRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  const existing = await prisma.category.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);
  const id = existing.id;

  const references = await categoryReferenceCounts(id);
  if (hasCategoryReferences(references)) {
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
