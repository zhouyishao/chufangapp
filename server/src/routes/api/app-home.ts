import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { ok } from '../../http/response';
import { buildPublicIdWhere, getPublicCode, getPublicId } from '../../lib/business-id';
import { serializeModuleForApp } from './app-home-shared';

export const apiAppHomeRouter = Router();

const serializeNav = (item: Awaited<ReturnType<typeof prisma.homeTopNav.findMany>>[number] & { style?: unknown; contentRule?: unknown }) => ({
  id: getPublicId('top_nav', item),
  code: getPublicCode('top_nav', item),
  name: item.name,
  navType: item.navType,
  contentType: item.contentType ?? null,
  displayPosition: item.displayPosition,
  isDefault: item.isDefault,
  sortOrder: item.sortOrder,
  showMoreEntry: item.showMoreEntry,
  style: item.style ?? null,
  contentRule: item.contentRule ?? null
});

const publicRecipeWhere = { deletedAt: null, status: 'ACTIVE' as const, isPublish: true, auditStatus: 'APPROVED' as const };

const isActiveAt = (now: Date) => ({
  OR: [{ startAt: null }, { startAt: { lte: now } }],
  AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }]
});

apiAppHomeRouter.get('/top-navs', async (req, res) => {
  const pageParam = typeof req.query.page === 'string' ? req.query.page.trim() : undefined;
  const displayPosition = pageParam === 'category' ? 'category_top' : 'home_top';
  const navs = await prisma.homeTopNav.findMany({
    where: { deletedAt: null, isDeleted: false, status: 'online', displayPosition },
    include: { style: true, contentRule: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
  });
  res.json(ok(navs.map(serializeNav)));
});

// 已迁移至 /api/app/home/top-navs/:navId/hero-banners
// 保留旧接口兼容，返回空列表避免硬错误
apiAppHomeRouter.get('/hero-banners', async (_req, res) => {
  res.json(ok([]));
});

apiAppHomeRouter.get('/top-navs/:navId/hero-banners', async (req, res) => {
  const nav = await prisma.homeTopNav.findFirst({
    where: { ...buildPublicIdWhere(req.params.navId), deletedAt: null, isDeleted: false, status: 'online' }
  });
  if (!nav) throw new HttpError('导航不存在', 404, 404);

  const now = new Date();
  const banners = await prisma.homeHeroBanner.findMany({
    where: {
      navId: nav.id,
      deletedAt: null,
      isDeleted: false,
      status: 'ENABLED',
      isPublish: true,
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] }
      ]
    },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
  });

  res.json(ok(banners.map((item) => ({
    id: item.id,
    moduleType: 'HOME_HERO_CAROUSEL',
    title: item.title,
    subtitle: item.subtitle,
    buttonText: item.buttonText,
    cover: item.cover,
    imageFocus: item.imageFocus,
    targetType: item.targetType,
    targetId: item.targetId,
    link: item.link,
    sortOrder: item.sortOrder
  }))));
});

// ====== 内容模块 ======

apiAppHomeRouter.get('/top-navs/:navId/modules', async (req, res) => {
  const nav = await prisma.homeTopNav.findFirst({
    where: { ...buildPublicIdWhere(req.params.navId), deletedAt: null, isDeleted: false, status: 'online' }
  });
  if (!nav) throw new HttpError('导航不存在', 404, 404);

  const modules = await prisma.contentModule.findMany({
    where: { navId: nav.id, status: 'ENABLED' },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
  });

  const resolved = await Promise.all(modules.map(serializeModuleForApp));
  res.json(ok(resolved));
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
