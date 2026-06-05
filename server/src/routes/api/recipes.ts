import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { ok, type PageResult } from '../../http/response';
import { buildPublicIdWhere, getPublicCode, getPublicId } from '../../lib/business-id';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  q: z.string().trim().optional(),
  categoryId: z.string().trim().optional()
});

export const apiRecipesRouter = Router();

const serializeCategory = (category: { id: number; bizId?: string | null; code?: string | null; type: unknown; name: string } | null) =>
  category
    ? { ...category, legacyId: category.id, id: getPublicId('category', category), code: getPublicCode('category', category) }
    : null;

const serializeBeverage = (item: { id: number; bizId?: string | null; code?: string | null; name: string; coverImage?: string | null; beverageType?: string | null; isAlcoholic?: boolean; alcoholDegree?: number | null; description?: string | null }) => ({
  ...item,
  legacyId: item.id,
  id: getPublicId('beverage', item),
  code: getPublicCode('beverage', item)
});

const serializeRecipe = (item: any) => ({
  ...item,
  legacyId: item.id,
  id: getPublicId('recipe', item),
  code: getPublicCode('recipe', item),
  category: serializeCategory(item.category ?? null),
  categoryId: item.category ? getPublicId('category', item.category) : null,
  beverages: item.beverages?.map((entry: any) => ({
    recommendReason: entry.recommendReason,
    sortOrder: entry.sortOrder,
    beverage: serializeBeverage(entry.beverage)
  }))
});

const resolveCategoryId = async (value: string | undefined) => {
  if (!value) return undefined;
  const item = await prisma.category.findFirst({ where: { ...buildPublicIdWhere(value), deletedAt: null } });
  return item?.id;
};

apiRecipesRouter.get('/', async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q } = parsed.data;
  const categoryId = await resolveCategoryId(parsed.data.categoryId);
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    isPublish: true,
    status: 'ACTIVE' as const,
    auditStatus: 'APPROVED' as const,
    ...(categoryId ? { categoryId } : {}),
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {})
  };

  const [list, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: [{ isRecommend: 'desc' }, { sort: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize,
      select: {
        id: true,
        bizId: true,
        code: true,
        title: true,
        subtitle: true,
        cover: true,
        description: true,
        cookTime: true,
        servings: true,
        difficulty: true,
        taste: true,
        scene: true,
        viewCount: true,
        favoriteCount: true,
        commentCount: true,
        createdAt: true,
        updatedAt: true,
        categoryId: true,
        category: { select: { id: true, bizId: true, code: true, name: true, type: true } },
        cuisineId: true,
        cuisine: { select: { id: true, name: true } }
      }
    }),
    prisma.recipe.count({ where })
  ]);

  const data: PageResult<ReturnType<typeof serializeRecipe>> = { list: list.map(serializeRecipe), total, page, pageSize };
  res.json(ok(data));
});

apiRecipesRouter.get('/:id', async (req, res) => {
  const recipe = await prisma.recipe.findFirst({
    where: { ...buildPublicIdWhere(req.params.id), deletedAt: null, isPublish: true, status: 'ACTIVE', auditStatus: 'APPROVED' },
    include: {
      category: { select: { id: true, bizId: true, code: true, name: true, type: true } },
      cuisine: { select: { id: true, name: true } },
      steps: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
      ingredients: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
      beverages: {
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: { beverage: true }
      }
    }
  });
  if (!recipe) throw new HttpError('not found', 404, 404);

  await prisma.recipe.update({ where: { id: recipe.id }, data: { viewCount: { increment: 1 } } });

  res.json(ok(serializeRecipe(recipe)));
});
