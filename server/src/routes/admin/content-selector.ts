import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { getPublicCode, getPublicId } from '../../lib/business-id';

const querySchema = z.object({
  type: z.enum(['category', 'tag', 'recommend_pool', 'topic', 'recipe', 'ingredient', 'fruit', 'seasoning', 'beverage']).default('category'),
  keyword: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export const adminContentSelectorRouter = Router();

const ingredientCategoryTypeBySelector = {
  ingredient: 'INGREDIENT',
  fruit: 'FRUIT',
  seasoning: 'SEASONING'
} as const;

adminContentSelectorRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { type, keyword, page, pageSize } = parsed.data;
  const skip = (page - 1) * pageSize;

  if (type === 'category') {
    const where = { deletedAt: null, status: 'ACTIVE' as const, isPublish: true, type: 'RECIPE' as const, ...(keyword ? { name: { contains: keyword, mode: 'insensitive' as const } } : {}) };
    const [rows, total] = await Promise.all([
      prisma.category.findMany({ where, orderBy: [{ sortOrder: 'desc' }, { sort: 'desc' }, { id: 'desc' }], skip, take: pageSize }),
      prisma.category.count({ where })
    ]);
    const list = rows.map((item) => ({ id: getPublicId('category', item), code: getPublicCode('category', item), name: item.name, type: 'category', status: item.status }));
    const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
    res.json(ok(data));
    return;
  }

  if (type === 'tag') {
    const where = { ...(keyword ? { name: { contains: keyword, mode: 'insensitive' as const } } : {}) };
    const [rows, total] = await Promise.all([
      prisma.tag.findMany({ where, orderBy: [{ sort: 'desc' }, { id: 'desc' }], skip, take: pageSize }),
      prisma.tag.count({ where })
    ]);
    const list = rows.map((item) => ({ id: String(item.id), name: item.name, type: 'tag', status: 'ACTIVE' }));
    const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
    res.json(ok(data));
    return;
  }

  if (type === 'recipe') {
    const where = { deletedAt: null, status: 'ACTIVE' as const, isPublish: true, ...(keyword ? { title: { contains: keyword, mode: 'insensitive' as const } } : {}) };
    const [rows, total] = await Promise.all([
      prisma.recipe.findMany({ where, orderBy: [{ sort: 'desc' }, { id: 'desc' }], skip, take: pageSize }),
      prisma.recipe.count({ where })
    ]);
    const list = rows.map((item) => ({ id: getPublicId('recipe', item), code: getPublicCode('recipe', item), name: item.title, type: 'recipe', status: item.status }));
    const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
    res.json(ok(data));
    return;
  }

  if (type === 'ingredient' || type === 'fruit' || type === 'seasoning') {
    const categoryType = ingredientCategoryTypeBySelector[type];
    const where = {
      deletedAt: null,
      status: 'ACTIVE' as const,
      isPublish: true,
      ...(keyword ? { name: { contains: keyword, mode: 'insensitive' as const } } : {}),
      category: { type: categoryType }
    };
    const [rows, total] = await Promise.all([
      prisma.ingredient.findMany({ where, orderBy: [{ sort: 'desc' }, { id: 'desc' }], skip, take: pageSize }),
      prisma.ingredient.count({ where })
    ]);
    const list = rows.map((item) => ({ id: getPublicId('ingredient', item), code: getPublicCode('ingredient', item), name: item.name, type, status: item.status }));
    const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
    res.json(ok(data));
    return;
  }

  if (type === 'beverage') {
    const where = { deletedAt: null, isDeleted: false, status: 'ACTIVE' as const, isPublish: true, ...(keyword ? { name: { contains: keyword, mode: 'insensitive' as const } } : {}) };
    const [rows, total] = await Promise.all([
      prisma.beverage.findMany({ where, orderBy: [{ sortOrder: 'desc' }, { id: 'desc' }], skip, take: pageSize }),
      prisma.beverage.count({ where })
    ]);
    const list = rows.map((item) => ({ id: getPublicId('beverage', item), code: getPublicCode('beverage', item), name: item.name, type: 'beverage', status: item.status }));
    const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
    res.json(ok(data));
    return;
  }

  const where = { deletedAt: null, status: 'ACTIVE' as const, isPublish: true, ...(keyword ? { title: { contains: keyword, mode: 'insensitive' as const } } : {}) };
  const [rows, total] = await Promise.all([
    prisma.recommendation.findMany({ where, orderBy: [{ sort: 'desc' }, { id: 'desc' }], skip, take: pageSize }),
    prisma.recommendation.count({ where })
  ]);
  const list = rows.map((item) => ({ id: getPublicId('recommend', item), code: getPublicCode('recommend', item), name: item.title, type, status: item.status }));
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});
