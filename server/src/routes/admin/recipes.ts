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
  auditStatus: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
  categoryId: z.coerce.number().int().optional()
});

const stepSchema = z.object({
  sortIndex: z.coerce.number().int().min(1),
  title: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().min(1),
  image: z.string().trim().max(255).nullable().optional()
});

const ingredientSchema = z.object({
  sortIndex: z.coerce.number().int().min(1),
  ingredientId: z.coerce.number().int().nullable().optional(),
  name: z.string().trim().min(1).max(120),
  amount: z.string().trim().max(80).nullable().optional()
});

const upsertSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(255).nullable().optional(),
  cover: z.string().trim().max(255).nullable().optional(),
  description: z.string().trim().nullable().optional(),
  categoryId: z.coerce.number().int().nullable().optional(),
  cookTime: z.coerce.number().int().min(0).nullable().optional(),
  servings: z.coerce.number().int().min(0).nullable().optional(),
  calories: z.coerce.number().int().min(0).nullable().optional(),
  difficulty: z.string().trim().max(20).nullable().optional(),
  taste: z.string().trim().max(50).nullable().optional(),
  scene: z.string().trim().max(50).nullable().optional(),
  tips: z.string().trim().nullable().optional(),
  sort: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
  auditStatus: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).default('DRAFT'),
  isPublish: z.coerce.boolean().default(false),
  isRecommend: z.coerce.boolean().default(false),
  isDraft: z.coerce.boolean().default(true),
  steps: z.array(stepSchema).default([]),
  ingredients: z.array(ingredientSchema).default([])
});

export const adminRecipesRouter = Router();

adminRecipesRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status, isPublish, isRecommend, auditStatus, categoryId } = parsed.data;
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
      include: { category: { select: { id: true, name: true, type: true } } }
    }),
    prisma.recipe.count({ where })
  ]);

  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminRecipesRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const recipe = await prisma.recipe.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: { select: { id: true, name: true, type: true } },
      steps: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
      ingredients: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] }
    }
  });
  if (!recipe) throw new HttpError('not found', 404, 404);
  res.json(ok(recipe));
});

adminRecipesRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const created = await prisma.recipe.create({
    data: {
      ...parsed.data,
      steps: { create: parsed.data.steps },
      ingredients: { create: parsed.data.ingredients }
    },
    include: {
      steps: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
      ingredients: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] }
    }
  });
  res.json(ok(created));
});

adminRecipesRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.recipeStep.deleteMany({ where: { recipeId: id } });
    await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
    return tx.recipe.update({
      where: { id },
      data: {
        ...parsed.data,
        steps: { create: parsed.data.steps },
        ingredients: { create: parsed.data.ingredients }
      },
      include: {
        steps: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
        ingredients: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] }
      }
    });
  });

  res.json(ok(updated));
});

adminRecipesRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const existing = await prisma.recipe.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);

  const deleted = await prisma.recipe.update({ where: { id }, data: { deletedAt: new Date() } });
  res.json(ok(deleted));
});

adminRecipesRouter.patch('/:id/publish', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const schema = z.object({ isPublish: z.coerce.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const updated = await prisma.recipe.update({
    where: { id },
    data: { isPublish: parsed.data.isPublish, isDraft: !parsed.data.isPublish }
  });
  res.json(ok(updated));
});

adminRecipesRouter.patch('/:id/recommend', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const schema = z.object({ isRecommend: z.coerce.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const updated = await prisma.recipe.update({
    where: { id },
    data: { isRecommend: parsed.data.isRecommend }
  });
  res.json(ok(updated));
});

adminRecipesRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const schema = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const updated = await prisma.recipe.update({
    where: { id },
    data: { status: parsed.data.status }
  });
  res.json(ok(updated));
});

adminRecipesRouter.patch('/:id/audit', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const schema = z.object({ auditStatus: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const data: Record<string, unknown> = { auditStatus: parsed.data.auditStatus };
  if (parsed.data.auditStatus === 'APPROVED') {
    data.isDraft = false;
  }

  const updated = await prisma.recipe.update({ where: { id }, data });
  res.json(ok(updated));
});
