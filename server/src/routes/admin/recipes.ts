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
  auditStatus: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
  categoryId: z.string().trim().optional()
});

const stepSchema = z.object({
  sortIndex: z.coerce.number().int().min(1),
  title: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().min(1),
  image: z.string().trim().max(255).nullable().optional(),
  video: z.string().trim().max(255).nullable().optional(),
  duration: z.coerce.number().int().min(0).nullable().optional()
});

const ingredientSchema = z.object({
  sortIndex: z.coerce.number().int().min(1),
  ingredientId: z.union([z.coerce.number().int(), z.string().trim()]).nullable().optional(),
  name: z.string().trim().min(1).max(120),
  amount: z.string().trim().max(80).nullable().optional(),
  unit: z.string().trim().max(32).nullable().optional(),
  type: z.string().trim().max(32).nullable().optional(),
  note: z.string().trim().nullable().optional()
});

const upsertSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(255).nullable().optional(),
  cover: z.string().trim().max(255).nullable().optional(),
  images: z.array(z.string().trim().max(255)).default([]),
  video: z.string().trim().max(255).nullable().optional(),
  description: z.string().trim().nullable().optional(),
  categoryId: z.union([z.coerce.number().int(), z.string().trim()]).nullable().optional(),
  cookTime: z.coerce.number().int().min(0).nullable().optional(),
  servings: z.coerce.number().int().min(0).nullable().optional(),
  calories: z.coerce.number().int().min(0).nullable().optional(),
  difficulty: z.string().trim().max(20).nullable().optional(),
  taste: z.string().trim().max(50).nullable().optional(),
  scene: z.string().trim().max(50).nullable().optional(),
  visibility: z.string().trim().max(32).nullable().optional(),
  tips: z.string().trim().nullable().optional(),
  sort: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
  auditStatus: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).default('DRAFT'),
  isPublish: z.coerce.boolean().default(false),
  isRecommend: z.coerce.boolean().default(false),
  isDraft: z.coerce.boolean().default(true),
  source_type: z.string().trim().max(80).nullable().optional(),
  source_name: z.string().trim().max(120).nullable().optional(),
  source_recipe_id: z.string().trim().max(120).nullable().optional(),
  source_url: z.string().trim().max(255).nullable().optional(),
  steps: z.array(stepSchema).default([]),
  ingredients: z.array(ingredientSchema).default([])
});

export const adminRecipesRouter = Router();

const includeRecipeRelations = {
  category: { select: { id: true, bizId: true, code: true, name: true, type: true } },
  steps: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' as const }, { id: 'asc' as const }] },
  ingredients: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' as const }, { id: 'asc' as const }] }
};

const serializeCategory = (category: { id: number; bizId?: string | null; code?: string | null; type: unknown; name: string } | null) =>
  category
    ? {
        ...category,
        legacyId: category.id,
        id: getPublicId('category', category),
        code: getPublicCode('category', category)
      }
    : null;

const serializeRecipe = <
  T extends { id: number; bizId?: string | null; code?: string | null; sort?: number; sortOrder?: number; category?: { id: number; bizId?: string | null; code?: string | null; type: unknown; name: string } | null; categoryId?: number | null }
>(item: T) => ({
  ...item,
  legacyId: item.id,
  id: getPublicId('recipe', item),
  code: getPublicCode('recipe', item),
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

const resolveIngredientId = async (value: number | string | null | undefined) => {
  if (value === undefined || value === null || value === '') return null;
  const item = await prisma.ingredient.findFirst({ where: { ...buildPublicIdWhere(value), deletedAt: null } });
  if (!item) throw new HttpError('食材不存在', 422, 422);
  return item.id;
};

const serializeBeverage = (item: {
  id: number;
  bizId?: string | null;
  code?: string | null;
  name: string;
  coverImage?: string | null;
  beverageType?: string | null;
  isAlcoholic?: boolean;
  alcoholDegree?: number | null;
}) => ({
  ...item,
  legacyId: item.id,
  id: getPublicId('beverage', item),
  code: getPublicCode('beverage', item)
});

const resolveBeverageId = async (value: number | string | null | undefined) => {
  if (value === undefined || value === null || value === '') return null;
  const item = await prisma.beverage.findFirst({ where: { ...buildPublicIdWhere(value), deletedAt: null } });
  if (!item) throw new HttpError('酒水饮品不存在', 422, 422);
  return item.id;
};

const getExistingRecipe = async (value: unknown) => {
  const existing = await prisma.recipe.findFirst({ where: { ...buildPublicIdWhere(value), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);
  return existing;
};

adminRecipesRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status, isPublish, isRecommend, auditStatus } = parsed.data;
  const categoryId = await resolveCategoryId(parsed.data.categoryId);
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(typeof isPublish === 'boolean' ? { isPublish } : {}),
    ...(typeof isRecommend === 'boolean' ? { isRecommend } : {}),
    ...(auditStatus ? { auditStatus } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {})
  };

  const [list, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize,
      include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
    }),
    prisma.recipe.count({ where })
  ]);

  const data: PageResult<ReturnType<typeof serializeRecipe>> = { list: list.map(serializeRecipe), total, page, pageSize };
  res.json(ok(data));
});

adminRecipesRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const recipe = await prisma.recipe.findFirst({
    where: { ...buildPublicIdWhere(req.params.id), deletedAt: null },
    include: includeRecipeRelations
  });
  if (!recipe) throw new HttpError('not found', 404, 404);
  res.json(ok(serializeRecipe(recipe)));
});

adminRecipesRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const categoryId = await resolveCategoryId(parsed.data.categoryId);
  const ingredients = await Promise.all(parsed.data.ingredients.map(async ({ ingredientId, ...item }) => ({ ...item, ingredientId: await resolveIngredientId(ingredientId) })));
  const codes = await prisma.recipe.findMany({ select: { code: true } });
  const importSource = {
    importSourceType: parsed.data.source_type ?? null,
    sourceName: parsed.data.source_name ?? null,
    sourceRecipeId: parsed.data.source_recipe_id ?? null,
    sourceUrl: parsed.data.source_url ?? null
  };
  if (importSource.importSourceType && importSource.sourceName && importSource.sourceRecipeId) {
    const existing = await prisma.recipe.findFirst({
      where: {
        importSourceType: importSource.importSourceType,
        sourceName: importSource.sourceName,
        sourceRecipeId: importSource.sourceRecipeId,
        deletedAt: null
      }
    });
    if (existing) {
      res.json(ok(serializeRecipe(existing)));
      return;
    }
  }
  const { categoryId: _categoryId, ingredients: _ingredients, steps, source_type, source_name, source_recipe_id, source_url, ...recipePayload } = parsed.data;
  const created = await prisma.recipe.create({
    data: {
      ...recipePayload,
      categoryId,
      bizId: createBusinessId('recipe'),
      code: nextCodeFromItems('recipe', codes),
      sortOrder: parsed.data.sort,
      ...importSource,
      steps: { create: steps },
      ingredients: { create: ingredients }
    },
    include: {
      steps: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
      ingredients: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] }
    }
  });
  res.json(ok(serializeRecipe(created)));
});

adminRecipesRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const categoryId = await resolveCategoryId(parsed.data.categoryId);
  const ingredients = await Promise.all(parsed.data.ingredients.map(async ({ ingredientId, ...item }) => ({ ...item, ingredientId: await resolveIngredientId(ingredientId) })));
  const { categoryId: _categoryId, ingredients: _ingredients, steps, source_type, source_name, source_recipe_id, source_url, ...recipePayload } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.recipe.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
    if (!existing) throw new HttpError('not found', 404, 404);
    const id = existing.id;
    await tx.recipeStep.deleteMany({ where: { recipeId: id } });
    await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
    return tx.recipe.update({
      where: { id },
      data: {
        ...recipePayload,
        categoryId,
        sortOrder: parsed.data.sort,
        importSourceType: source_type ?? null,
        sourceName: source_name ?? null,
        sourceRecipeId: source_recipe_id ?? null,
        sourceUrl: source_url ?? null,
        steps: { create: steps },
        ingredients: { create: ingredients }
      },
      include: {
        steps: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
        ingredients: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] }
      }
    });
  });

  res.json(ok(serializeRecipe(updated)));
});

adminRecipesRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  const existing = await getExistingRecipe(req.params.id);

  const deleted = await prisma.recipe.update({ where: { id: existing.id }, data: { deletedAt: new Date(), isDeleted: true } });
  res.json(ok(serializeRecipe(deleted)));
});

adminRecipesRouter.patch('/:id/publish', requireAdminAuth, async (req, res) => {
  const schema = z.object({ isPublish: z.coerce.boolean().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const existing = await getExistingRecipe(req.params.id);
  if (parsed.data.isPublish === false) {
    const offline = await prisma.recipe.update({ where: { id: existing.id }, data: { isPublish: false } });
    res.json(ok(serializeRecipe(offline)));
    return;
  }
  if (existing.auditStatus !== 'APPROVED') throw new HttpError('菜谱审核通过后才能发布', 422, 422);
  if (existing.status !== 'ACTIVE') throw new HttpError('菜谱启用后才能发布', 422, 422);

  const updated = await prisma.recipe.update({
    where: { id: existing.id },
    data: { isPublish: true, isDraft: false }
  });
  res.json(ok(serializeRecipe(updated)));
});

adminRecipesRouter.patch('/:id/offline', requireAdminAuth, async (req, res) => {
  const existing = await getExistingRecipe(req.params.id);
  const updated = await prisma.recipe.update({ where: { id: existing.id }, data: { isPublish: false } });
  res.json(ok(serializeRecipe(updated)));
});

adminRecipesRouter.patch('/:id/submit-audit', requireAdminAuth, async (req, res) => {
  const existing = await getExistingRecipe(req.params.id);
  const updated = await prisma.recipe.update({
    where: { id: existing.id },
    data: { auditStatus: 'PENDING', isDraft: false, isPublish: false, rejectReason: null }
  });
  res.json(ok(serializeRecipe(updated)));
});

adminRecipesRouter.patch('/:id/recommend', requireAdminAuth, async (req, res) => {
  const schema = z.object({ isRecommend: z.coerce.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const existing = await getExistingRecipe(req.params.id);
  const updated = await prisma.recipe.update({
    where: { id: existing.id },
    data: { isRecommend: parsed.data.isRecommend }
  });
  res.json(ok(serializeRecipe(updated)));
});

adminRecipesRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const schema = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const existing = await getExistingRecipe(req.params.id);
  const updated = await prisma.recipe.update({
    where: { id: existing.id },
    data: { status: parsed.data.status }
  });
  res.json(ok(serializeRecipe(updated)));
});

adminRecipesRouter.patch('/:id/audit', requireAdminAuth, async (req, res) => {
  const schema = z.object({
    auditStatus: z.enum(['APPROVED', 'REJECTED']),
    rejectReason: z.string().trim().max(500).nullable().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await getExistingRecipe(req.params.id);

  const data: Record<string, unknown> = { auditStatus: parsed.data.auditStatus };
  if (parsed.data.auditStatus === 'APPROVED') {
    data.isDraft = false;
    data.rejectReason = null;
  } else {
    if (!parsed.data.rejectReason) throw new HttpError('驳回原因不能为空', 422, 422);
    data.isDraft = true;
    data.isPublish = false;
    data.rejectReason = parsed.data.rejectReason;
  }

  const updated = await prisma.recipe.update({ where: { id: existing.id }, data });
  res.json(ok(serializeRecipe(updated)));
});

adminRecipesRouter.get('/:id/beverages', requireAdminAuth, async (req, res) => {
  const recipe = await getExistingRecipe(req.params.id);
  const list = await prisma.recipeBeverage.findMany({
    where: { recipeId: recipe.id },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: { beverage: true }
  });
  res.json(ok(list.map((item) => ({
    id: String(item.id),
    recipeId: getPublicId('recipe', recipe),
    beverageId: getPublicId('beverage', item.beverage),
    recommendReason: item.recommendReason,
    sortOrder: item.sortOrder,
    beverage: serializeBeverage(item.beverage),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }))));
});

adminRecipesRouter.post('/:id/beverages', requireAdminAuth, async (req, res) => {
  const schema = z.object({
    beverageId: z.string().trim().min(1),
    recommendReason: z.string().trim().max(500).nullable().optional(),
    sortOrder: z.coerce.number().int().min(0).default(0)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const recipe = await getExistingRecipe(req.params.id);
  const beverageId = await resolveBeverageId(parsed.data.beverageId);
  if (!beverageId) throw new HttpError('酒水饮品不存在', 422, 422);
  const item = await prisma.recipeBeverage.upsert({
    where: { recipeId_beverageId: { recipeId: recipe.id, beverageId } },
    create: {
      recipeId: recipe.id,
      beverageId,
      recommendReason: parsed.data.recommendReason ?? null,
      sortOrder: parsed.data.sortOrder
    },
    update: {
      recommendReason: parsed.data.recommendReason ?? null,
      sortOrder: parsed.data.sortOrder
    },
    include: { beverage: true }
  });
  res.json(ok({
    id: String(item.id),
    recipeId: getPublicId('recipe', recipe),
    beverageId: getPublicId('beverage', item.beverage),
    recommendReason: item.recommendReason,
    sortOrder: item.sortOrder,
    beverage: serializeBeverage(item.beverage),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }));
});

adminRecipesRouter.delete('/:id/beverages/:beverageId', requireAdminAuth, async (req, res) => {
  const recipe = await getExistingRecipe(req.params.id);
  const beverageId = await resolveBeverageId(String(req.params.beverageId));
  if (!beverageId) throw new HttpError('酒水饮品不存在', 422, 422);
  await prisma.recipeBeverage.deleteMany({ where: { recipeId: recipe.id, beverageId } });
  res.json(ok({ deleted: true }));
});
