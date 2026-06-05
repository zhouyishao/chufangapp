import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { ok } from '../../http/response';
import { buildPublicIdWhere, getPublicCode, getPublicId } from '../../lib/business-id';

export const apiAppHomeRouter = Router();

const serializeNav = (item: Awaited<ReturnType<typeof prisma.homeTopNav.findMany>>[number] & { style?: unknown; contentRule?: unknown }) => ({
  id: getPublicId('top_nav', item),
  code: getPublicCode('top_nav', item),
  name: item.name,
  navType: item.navType,
  isDefault: item.isDefault,
  sortOrder: item.sortOrder,
  showMoreEntry: item.showMoreEntry,
  style: item.style ?? null,
  contentRule: item.contentRule ?? null
});

const publicRecipeWhere = { deletedAt: null, status: 'ACTIVE' as const, isPublish: true, auditStatus: 'APPROVED' as const };

apiAppHomeRouter.get('/top-navs', async (_req, res) => {
  const navs = await prisma.homeTopNav.findMany({
    where: { deletedAt: null, isDeleted: false, status: 'online' },
    include: { style: true, contentRule: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
  });
  res.json(ok(navs.map(serializeNav)));
});

apiAppHomeRouter.get('/top-navs/:id/contents', async (req, res) => {
  const parsed = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(10) }).safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const nav = await prisma.homeTopNav.findFirst({
    where: { ...buildPublicIdWhere(req.params.id), deletedAt: null, isDeleted: false, status: 'online' },
    include: { relations: true, contentRule: true }
  });
  if (!nav) throw new HttpError('not found', 404, 404);
  const relation = nav.relations[0];
  const skip = (parsed.data.page - 1) * parsed.data.pageSize;
  const take = Math.min(parsed.data.pageSize, nav.contentRule?.displayCount ?? parsed.data.pageSize);
  const category = relation?.relationType === 'category' ? await prisma.category.findFirst({ where: { ...buildPublicIdWhere(relation.relationId), deletedAt: null } }) : null;
  const recipes = await prisma.recipe.findMany({
    where: { ...publicRecipeWhere, ...(category ? { categoryId: category.id } : {}) },
    orderBy: nav.contentRule?.sortRule === 'latest' ? [{ updatedAt: 'desc' }] : [{ isRecommend: 'desc' }, { sortOrder: 'desc' }, { id: 'desc' }],
    skip,
    take,
    select: { id: true, bizId: true, code: true, title: true, cover: true, cookTime: true, difficulty: true, calories: true }
  });
  res.json(ok({
    navId: getPublicId('top_nav', nav),
    navName: nav.name,
    moreButtonText: nav.contentRule?.moreButtonText ?? '查看更多',
    items: recipes.map((item) => ({
      id: getPublicId('recipe', item),
      code: getPublicCode('recipe', item),
      type: 'recipe',
      title: item.title,
      coverUrl: item.cover,
      duration: item.cookTime ? `${item.cookTime}分钟` : null,
      difficulty: item.difficulty,
      calorie: item.calories ? `约${item.calories}kcal` : null
    }))
  }));
});
