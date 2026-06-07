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

const isActiveAt = (now: Date) => ({
  OR: [{ startAt: null }, { startAt: { lte: now } }],
  AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }]
});

apiAppHomeRouter.get('/top-navs', async (_req, res) => {
  const navs = await prisma.homeTopNav.findMany({
    where: { deletedAt: null, isDeleted: false, status: 'online' },
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

const displayStyleContentTypeMap: Record<string, string[]> = {
  HORIZONTAL_RECIPE_CARD: ['RECIPE'],
  SEASONAL_INGREDIENT_CARD: ['INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE'],
  IMAGE_TEXT_LIST: ['RECIPE'],
  TWO_COLUMN_RECIPE_GRID: ['RECIPE']
};

const serializeModuleForApp = async (mod: {
  id: number;
  navId: number;
  title: string;
  subtitle: string | null;
  displayStyle: string;
  contentType: string;
  contentSource: string;
  displayCount: number;
  showMore: boolean;
  moreLink: string | null;
  sortOrder: number;
  status: string;
  items: unknown;
  categoryId: number | null;
  tagId: number | null;
}) => {
  const moduleItems: unknown[] = Array.isArray(mod.items) ? mod.items : [];
  let resolvedItems: unknown[] = [];

  if (mod.contentSource === 'MANUAL') {
    // Manual items: resolve recipe/ingredient info
    const typedItems = moduleItems as Array<{ id: string; type: string; sortOrder: number }>;
    for (const item of typedItems) {
      if ((item.type === 'RECIPE' || mod.contentType === 'RECIPE') && mod.contentType === 'RECIPE') {
        const recipe = await prisma.recipe.findFirst({
          where: { ...buildPublicIdWhere(item.id), ...publicRecipeWhere },
          select: { id: true, bizId: true, code: true, title: true, cover: true, cookTime: true, difficulty: true, calories: true, servings: true, description: true, favoriteCount: true }
        });
        if (recipe) {
          resolvedItems.push({
            id: getPublicId('recipe', recipe),
            code: getPublicCode('recipe', recipe),
            type: 'recipe',
            title: recipe.title,
            cover: recipe.cover,
            duration: recipe.cookTime ? `${recipe.cookTime}分钟` : null,
            difficulty: recipe.difficulty,
            servings: recipe.servings,
            calories: recipe.calories ? `约${recipe.calories}kcal` : null,
            description: recipe.description,
            favoriteCount: recipe.favoriteCount,
            sortOrder: item.sortOrder
          });
        }
      }
      if (['INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE'].includes(mod.contentType)) {
        const ingredient = await prisma.ingredient.findFirst({
          where: { ...buildPublicIdWhere(item.id), deletedAt: null, status: 'ACTIVE', isPublish: true },
          select: { id: true, name: true, cover: true, currentPrice: true, priceUnit: true }
        });
        if (ingredient) {
          resolvedItems.push({
            id: getPublicId('ingredient', ingredient),
            type: 'ingredient',
            name: ingredient.name,
            cover: ingredient.cover,
            currentPrice: ingredient.currentPrice,
            priceUnit: ingredient.priceUnit,
            sortOrder: item.sortOrder
          });
        }
      }
    }
    resolvedItems.sort((a, b) => (a as { sortOrder: number }).sortOrder - (b as { sortOrder: number }).sortOrder);
  } else if (mod.contentSource === 'CATEGORY' && mod.categoryId) {
    if (['RECIPE'].includes(mod.contentType)) {
      const recipes = await prisma.recipe.findMany({
        where: { ...publicRecipeWhere, categoryId: mod.categoryId },
        orderBy: [{ isRecommend: 'desc' }, { sortOrder: 'desc' }, { id: 'desc' }],
        take: mod.displayCount,
        select: { id: true, bizId: true, code: true, title: true, cover: true, cookTime: true, difficulty: true, calories: true, servings: true, description: true, favoriteCount: true }
      });
      resolvedItems = recipes.map((r, i) => ({
        id: getPublicId('recipe', r),
        code: getPublicCode('recipe', r),
        type: 'recipe',
        title: r.title,
        cover: r.cover,
        duration: r.cookTime ? `${r.cookTime}分钟` : null,
        difficulty: r.difficulty,
        servings: r.servings,
        calories: r.calories ? `约${r.calories}kcal` : null,
        description: r.description,
        favoriteCount: r.favoriteCount,
        sortOrder: i
      }));
    } else {
      const ingredients = await prisma.ingredient.findMany({
        where: { deletedAt: null, status: 'ACTIVE', isPublish: true, categoryId: mod.categoryId },
        orderBy: [{ sortOrder: 'desc' }, { id: 'desc' }],
        take: mod.displayCount,
        select: { id: true, name: true, cover: true, currentPrice: true, priceUnit: true }
      });
      resolvedItems = ingredients.map((ing, i) => ({
        id: getPublicId('ingredient', ing),
        type: 'ingredient',
        name: ing.name,
        cover: ing.cover,
        currentPrice: ing.currentPrice,
        priceUnit: ing.priceUnit,
        sortOrder: i
      }));
    }
  } else if (mod.contentSource === 'TAG' && mod.tagId) {
    if (['RECIPE'].includes(mod.contentType)) {
      const tagId = mod.tagId;
      const recipes = await prisma.recipe.findMany({
        where: {
          ...publicRecipeWhere,
          recipeTags: { some: { tagId } }
        },
        orderBy: [{ isRecommend: 'desc' }, { sortOrder: 'desc' }, { id: 'desc' }],
        take: mod.displayCount,
        select: { id: true, bizId: true, code: true, title: true, cover: true, cookTime: true, difficulty: true, calories: true, servings: true, description: true, favoriteCount: true }
      });
      resolvedItems = recipes.map((r, i) => ({
        id: getPublicId('recipe', r),
        code: getPublicCode('recipe', r),
        type: 'recipe',
        title: r.title,
        cover: r.cover,
        duration: r.cookTime ? `${r.cookTime}分钟` : null,
        difficulty: r.difficulty,
        servings: r.servings,
        calories: r.calories ? `约${r.calories}kcal` : null,
        description: r.description,
        favoriteCount: r.favoriteCount,
        sortOrder: i
      }));
    } else {
      const tagId = mod.tagId;
      const ingredients = await prisma.ingredient.findMany({
        where: {
          deletedAt: null, status: 'ACTIVE', isPublish: true,
          ingredientTags: { some: { tagId } }
        },
        orderBy: [{ sortOrder: 'desc' }, { id: 'desc' }],
        take: mod.displayCount,
        select: { id: true, name: true, cover: true, currentPrice: true, priceUnit: true }
      });
      resolvedItems = ingredients.map((ing, i) => ({
        id: getPublicId('ingredient', ing),
        type: 'ingredient',
        name: ing.name,
        cover: ing.cover,
        currentPrice: ing.currentPrice,
        priceUnit: ing.priceUnit,
        sortOrder: i
      }));
    }
  }

  return {
    id: mod.id,
    navId: mod.navId,
    title: mod.title,
    subtitle: mod.subtitle,
    displayStyle: mod.displayStyle,
    contentType: mod.contentType,
    contentSource: mod.contentSource,
    displayCount: mod.displayCount,
    showMore: mod.showMore,
    moreLink: mod.moreLink,
    sortOrder: mod.sortOrder,
    status: mod.status,
    items: resolvedItems
  };
};

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
